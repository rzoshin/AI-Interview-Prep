import { progressRepository } from "@/repositories/progress.repository";
import { questionRepository } from "@/repositories/question.repository";
import { interviewSessionRepository } from "@/repositories/interview-session.repository";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/cache";
import { computeStreakDays } from "@/lib/utils/streak";
import type { IInterviewSession, IProgress, IQuestion, ITopic } from "@/types";

// Mastery thresholds (0-100).
const WEAK_THRESHOLD = 50;
const STRONG_THRESHOLD = 75;

// Weighted moving average so repeated activity converges instead of jumping.
const MASTERY_DECAY = 0.6;

// Baseline mastery given to a topic the first time the user studies one of its
// questions. Below WEAK_THRESHOLD so it surfaces as a focus area until proven.
const STUDY_BASELINE = 20;

interface MasteryEntry {
  topic: string;
  score: number;
  lastActivity: Date;
}

class ProgressService {
  // Cache-first read of the user's progress summary (topic populated).
  async getProgress(userId: string): Promise<IProgress | null> {
    const cacheKey = CACHE_KEYS.progress(userId);

    const cached = await cache.get<IProgress>(cacheKey);
    if (cached) return this.enrich(cached);

    const stored = await progressRepository.findByUserId(userId);
    if (!stored) return null;

    const result = this.enrich(stored as unknown as IProgress);
    await cache.set(cacheKey, result, CACHE_TTL.PROGRESS);
    return result;
  }

  getStreakDays(progress: Pick<IProgress, "activityDates"> | null): number {
    return computeStreakDays(progress?.activityDates ?? []);
  }

  // Folds a completed interview session into the user's mastery scores. Each
  // turn's question is resolved to its topic; per-topic average turn score
  // (0-10) is scaled to 0-100 and blended into the existing mastery. Best-effort
  // — callers should not let failures here break session completion.
  async recordInterviewSession(userId: string, session: IInterviewSession): Promise<void> {
    const turns = session.turns ?? [];
    if (turns.length === 0) return;

    // Group turn scores by topic id.
    const scoresByTopic = new Map<string, number[]>();
    for (const turn of turns) {
      const questionId =
        typeof turn.question === "object" && turn.question
          ? String((turn.question as IQuestion)._id)
          : String(turn.question);

      const question = await questionRepository.findById(questionId);
      if (!question) continue;

      const topicId =
        typeof question.topic === "object" && question.topic
          ? String((question.topic as unknown as ITopic)._id)
          : String(question.topic);
      if (!topicId) continue;

      const list = scoresByTopic.get(topicId) ?? [];
      list.push(turn.score ?? 0);
      scoresByTopic.set(topicId, list);
    }

    if (scoresByTopic.size === 0) return;

    const mastery = await this.loadMasteryMap(userId);
    for (const [topicId, scores] of scoresByTopic) {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      const sample = clamp(avg * 10, 0, 100); // 0-10 -> 0-100
      this.blend(mastery, topicId, sample);
    }

    await this.persist(userId, mastery);
  }

  // Folds a topic quiz result into mastery. AI topic-quizzes are not backed by
  // real Question docs, so we update topicMastery directly rather than push to
  // quizHistory (which requires a question ref).
  async recordQuizResult(
    userId: string,
    { topicId, correct, total }: { topicId: string; correct: number; total: number }
  ): Promise<void> {
    if (total <= 0) return;
    const sample = clamp((correct / total) * 100, 0, 100);

    const mastery = await this.loadMasteryMap(userId);
    this.blend(mastery, topicId, sample);
    await this.persist(userId, mastery);
  }

  // Marks a question completed (e.g. after studying it). Registers the question's
  // topic in mastery at a baseline so studied topics count toward "explored" and
  // weak-area detection, then recomputes readiness (coverage changes).
  async markComplete(userId: string, questionId: string): Promise<void> {
    await progressRepository.addCompletedQuestion(userId, questionId);

    const mastery = await this.loadMasteryMap(userId);

    const question = await questionRepository.findById(questionId);
    if (question) {
      const topicId =
        typeof question.topic === "object" && question.topic
          ? String((question.topic as unknown as ITopic)._id)
          : String(question.topic);
      // Seed only if untracked — never lower an existing quiz/interview score.
      if (topicId && !mastery.has(topicId)) {
        mastery.set(topicId, {
          topic: topicId,
          score: STUDY_BASELINE,
          lastActivity: new Date(),
        });
      }
    }

    await this.persist(userId, mastery);
  }

  // ----- internal helpers -----

  private async loadMasteryMap(userId: string): Promise<Map<string, MasteryEntry>> {
    const doc = await progressRepository.findOrCreate(userId);
    const map = new Map<string, MasteryEntry>();
    for (const m of doc.topicMastery ?? []) {
      const topicId = String(m.topic);
      map.set(topicId, {
        topic: topicId,
        score: m.score ?? 0,
        lastActivity: m.lastActivity ?? new Date(),
      });
    }
    return map;
  }

  private blend(map: Map<string, MasteryEntry>, topicId: string, sample: number): void {
    const existing = map.get(topicId);
    const score = existing
      ? Math.round(MASTERY_DECAY * existing.score + (1 - MASTERY_DECAY) * sample)
      : Math.round(sample);
    map.set(topicId, { topic: topicId, score, lastActivity: new Date() });
  }

  // Recomputes weak/strong areas + the composite readiness score from the given
  // mastery map and persists everything in one upsert. Invalidates the cache.
  private async persist(userId: string, mastery: Map<string, MasteryEntry>): Promise<void> {
    await progressRepository.recordActivityDate(userId);

    const entries = [...mastery.values()];

    const weakAreas = entries.filter((e) => e.score < WEAK_THRESHOLD).map((e) => e.topic);
    const strongAreas = entries.filter((e) => e.score >= STRONG_THRESHOLD).map((e) => e.topic);

    const readinessScore = await this.computeReadiness(userId, entries);

    await progressRepository.upsertComputed(userId, {
      topicMastery: entries.map((e) => ({
        topic: e.topic,
        score: e.score,
        lastActivity: e.lastActivity,
      })),
      weakAreas,
      strongAreas,
      readinessScore,
    });

    await cache.del(CACHE_KEYS.progress(userId));
  }

  // readiness = 0.5*avgMastery + 0.3*interviewPerf + 0.2*coverage (all 0-100).
  private async computeReadiness(userId: string, entries: MasteryEntry[]): Promise<number> {
    const avgMastery =
      entries.length > 0 ? entries.reduce((s, e) => s + e.score, 0) / entries.length : 0;

    const sessions = await interviewSessionRepository.findByUser(userId, { limit: 10 });
    const completed = sessions.filter((s) => s.status === "completed");
    const interviewPerf =
      completed.length > 0
        ? clamp(
            (completed.reduce((s, sess) => s + (sess.totalScore ?? 0), 0) / completed.length) * 10,
            0,
            100
          )
        : 0;

    const progress = await progressRepository.findOrCreate(userId);
    const completedCount = progress.completedQuestions?.length ?? 0;
    const totalPublished = await questionRepository.count({ isPublished: true });
    const coverage = totalPublished > 0 ? clamp((completedCount / totalPublished) * 100, 0, 100) : 0;

    return Math.round(0.5 * avgMastery + 0.3 * interviewPerf + 0.2 * coverage);
  }

  private enrich(progress: IProgress): IProgress {
    return {
      ...progress,
      activityDates: progress.activityDates ?? [],
      streakDays: computeStreakDays(progress.activityDates ?? []),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const progressService = new ProgressService();
