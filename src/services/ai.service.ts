import { aiAnswerRepository } from "@/repositories/ai-answer.repository";
import { questionRepository } from "@/repositories/question.repository";
import { topicRepository } from "@/repositories/topic.repository";
import { getAIClient } from "@/lib/ai/client";
import { buildAnswerPrompt, ANSWER_PROMPT_VERSION } from "@/lib/ai/prompts/answer.prompt";
import { buildTopicQuizPrompt } from "@/lib/ai/prompts/quiz.prompt";
import { generatedAnswerSchema, topicQuizSchema } from "@/lib/validators/ai.schema";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/cache";
import type { IAIAnswer, ITopic, QuizQuestion } from "@/types";

export interface TopicQuizResult {
  topicName: string;
  quiz: QuizQuestion[];
}

class AIService {
  // Cache-first read of a stored answer. Returns null when not yet generated.
  async getAnswer(questionId: string): Promise<IAIAnswer | null> {
    const cacheKey = CACHE_KEYS.aiAnswer(questionId);

    const cached = await cache.get<IAIAnswer>(cacheKey);
    if (cached) return cached;

    const stored = await aiAnswerRepository.findByQuestionId(questionId);
    if (!stored) return null;

    const result = stored as unknown as IAIAnswer;
    await cache.set(cacheKey, result, CACHE_TTL.AI_ANSWER);
    return result;
  }

  // Generates (or returns existing) answers for a question. Cache-first; never
  // regenerates unless `force` is true.
  async generateAnswers(
    questionId: string,
    { force = false }: { force?: boolean } = {}
  ): Promise<IAIAnswer> {
    if (!force) {
      const existing = await this.getAnswer(questionId);
      if (existing) return existing;
    }

    const question = await questionRepository.findById(questionId);
    if (!question) throw new Error("Question not found");

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

    const { system, user } = buildAnswerPrompt({
      question: question.question,
      topic: topicName,
      difficulty: question.difficulty,
    });

    let parsed;
    try {
      const response = await ai.client.chat.completions.create({
        model: ai.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      parsed = generatedAnswerSchema.parse(JSON.parse(content));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      console.error("[ai.generate] generation failed:", error);
      throw new Error(`AI answer generation failed: ${reason}`);
    }

    const saved = await aiAnswerRepository.upsert(questionId, {
      question: questionId,
      ...parsed,
      generatedBy: ai.provider,
      promptVersion: ANSWER_PROMPT_VERSION,
    });

    const result = saved as unknown as IAIAnswer;
    await cache.set(CACHE_KEYS.aiAnswer(questionId), result, CACHE_TTL.AI_ANSWER);
    return result;
  }

  async invalidateAnswer(questionId: string): Promise<void> {
    await cache.del(CACHE_KEYS.aiAnswer(questionId));
  }

  // Generates (cache-first) a fresh multiple-choice quiz for an entire topic,
  // grounded by a sample of the topic's questions.
  async getTopicQuiz(topicId: string, { force = false }: { force?: boolean } = {}): Promise<TopicQuizResult> {
    const cacheKey = CACHE_KEYS.topicQuiz(topicId);

    if (!force) {
      const cached = await cache.get<TopicQuizResult>(cacheKey);
      if (cached) return cached;
    }

    const topic = await topicRepository.findById(topicId);
    if (!topic) throw new Error("Topic not found");

    const questions = await questionRepository.findWithFilters(
      { topic: topicId },
      { limit: 15 }
    );
    const sampleQuestions = questions.map((q) => q.question);

    const ai = getAIClient();
    if (!ai) {
      throw new Error(
        "No AI provider configured. Add GROQ_API_KEY (free at console.groq.com) to .env.local."
      );
    }

    const { system, user } = buildTopicQuizPrompt({
      topicName: topic.name,
      sampleQuestions,
    });

    let quiz: QuizQuestion[];
    try {
      const response = await ai.client.chat.completions.create({
        model: ai.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
        max_tokens: 6000,
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      const parsed = topicQuizSchema.parse(JSON.parse(content));
      quiz = parsed.quiz.filter((q) => q.question && q.options.length >= 2);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      console.error("[ai.topicQuiz] generation failed:", error);
      throw new Error(`Quiz generation failed: ${reason}`);
    }

    if (quiz.length === 0) {
      throw new Error("The AI returned an empty quiz. Please try again.");
    }

    const result: TopicQuizResult = { topicName: topic.name, quiz };
    await cache.set(cacheKey, result, CACHE_TTL.TOPIC_QUIZ);
    return result;
  }
}

export const aiService = new AIService();
