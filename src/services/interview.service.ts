import { interviewSessionRepository } from "@/repositories/interview-session.repository";
import { questionRepository } from "@/repositories/question.repository";
import { getAIClient } from "@/lib/ai/client";
import {
  buildInterviewEvalPrompt,
} from "@/lib/ai/prompts/interview.prompt";
import { interviewEvaluationSchema } from "@/lib/validators/ai.schema";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import type {
  IInterviewSession,
  InterviewEvaluationResult,
  InterviewQuestion,
  ITopic,
  Difficulty,
} from "@/types";
import type { QueryOptions } from "@/types/api";

interface StartSessionInput {
  topicId?: string;
  difficulty?: Difficulty;
  questionCount: number;
}

export interface StartSessionResult {
  session: IInterviewSession;
  questions: InterviewQuestion[];
}

class InterviewService {
  // Creates a new interview session and selects the questions to ask. The
  // session document only stores answered turns, so the selected questions are
  // returned to the client which drives the question queue.
  async startSession(
    userId: string,
    { topicId, difficulty, questionCount }: StartSessionInput
  ): Promise<StartSessionResult> {
    const candidates = await questionRepository.findWithFilters(
      { isPublished: true, topic: topicId, difficulty },
      { limit: Math.max(questionCount * 3, questionCount), sort: { createdAt: -1 } }
    );

    if (candidates.length === 0) {
      throw new NotFoundError("No published questions match the selected criteria");
    }

    const selected = shuffle(candidates).slice(0, questionCount);

    const session = await interviewSessionRepository.create({ user: userId });

    const questions: InterviewQuestion[] = selected.map((q) => ({
      _id: String(q._id),
      question: q.question,
      difficulty: q.difficulty,
      topic:
        typeof q.topic === "object" && q.topic
          ? (q.topic as unknown as ITopic).name
          : "General",
    }));

    return { session: session as unknown as IInterviewSession, questions };
  }

  // Evaluates a single answer with the LLM, records it as a turn, and returns
  // the score/feedback for that turn.
  async submitAnswer(
    userId: string,
    sessionId: string,
    { questionId, answer }: { questionId: string; answer: string }
  ): Promise<InterviewEvaluationResult> {
    const session = await interviewSessionRepository.findById(sessionId);
    if (!session) throw new NotFoundError("Interview session");
    this.assertOwner(session, userId);
    if (session.status !== "active") {
      throw new ValidationError("This interview session is already completed");
    }

    const question = await questionRepository.findById(questionId);
    if (!question) throw new NotFoundError("Question");

    const ai = getAIClient();
    if (!ai) {
      throw new Error(
        "No AI provider configured. Add GROQ_API_KEY (free at console.groq.com) to .env.local."
      );
    }

    const topicName =
      typeof question.topic === "object" && question.topic
        ? (question.topic as unknown as ITopic).name
        : "General";

    const { system, user } = buildInterviewEvalPrompt({
      question: question.question,
      topic: topicName,
      difficulty: question.difficulty,
      userAnswer: answer,
    });

    let evaluation;
    try {
      const response = await ai.client.chat.completions.create({
        model: ai.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      evaluation = interviewEvaluationSchema.parse(JSON.parse(content));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      console.error("[interview.submitAnswer] evaluation failed:", error);
      throw new Error(`Answer evaluation failed: ${reason}`);
    }

    const score = Math.round(evaluation.score);

    await interviewSessionRepository.addTurn(sessionId, {
      question: questionId,
      userAnswer: answer,
      score,
      feedback: evaluation.feedback,
      improvements: evaluation.improvements,
      followUps: evaluation.followUps,
    });

    return {
      questionId,
      score,
      feedback: evaluation.feedback,
      improvements: evaluation.improvements,
      followUps: evaluation.followUps,
    };
  }

  // Finalizes a session: computes the total (average) score and marks it
  // completed. Intentionally self-contained — progress tracking is Phase 7.
  async completeSession(userId: string, sessionId: string): Promise<IInterviewSession> {
    const session = await interviewSessionRepository.findById(sessionId);
    if (!session) throw new NotFoundError("Interview session");
    this.assertOwner(session, userId);

    const turns = session.turns ?? [];
    const totalScore =
      turns.length > 0
        ? Math.round(turns.reduce((sum, t) => sum + (t.score ?? 0), 0) / turns.length)
        : 0;

    const updated = await interviewSessionRepository.update(sessionId, {
      status: "completed",
      completedAt: new Date(),
      totalScore,
    });

    return updated as unknown as IInterviewSession;
  }

  async getSession(userId: string, sessionId: string): Promise<IInterviewSession> {
    const session = await interviewSessionRepository.findById(sessionId);
    if (!session) throw new NotFoundError("Interview session");
    this.assertOwner(session, userId);
    return session as unknown as IInterviewSession;
  }

  async getHistory(
    userId: string,
    options: QueryOptions = {}
  ): Promise<IInterviewSession[]> {
    const sessions = await interviewSessionRepository.findByUser(userId, options);
    return sessions as unknown as IInterviewSession[];
  }

  private assertOwner(
    session: { user: unknown },
    userId: string
  ): void {
    const ownerId =
      typeof session.user === "object" && session.user
        ? String((session.user as { _id: unknown })._id)
        : String(session.user);
    if (ownerId !== userId) {
      throw new AuthorizationError("You do not have access to this interview session");
    }
  }
}

// Fisher-Yates shuffle on a copy so question order varies per session.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const interviewService = new InterviewService();
