import { callAIEvaluation } from "@/lib/ai/evaluate-answer";
import {
  buildStudyEvalUserPrompt,
  getDefaultStudySystemPrompt,
} from "@/lib/ai/prompts/study.prompt";
import { studyEvaluationSchema } from "@/lib/validators/ai.schema";
import { studyNoteRepository } from "@/repositories/study-note.repository";
import { questionRepository } from "@/repositories/question.repository";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import type { ITopic } from "@/types";
import type { StudyVerdict } from "@/lib/db/models/StudyNote";

export interface StudyNoteDTO {
  _id: string;
  questionId: string;
  content: string;
  evaluation?: {
    verdict: StudyVerdict;
    score: number;
    feedback: string;
    improvements: string[];
    evaluatedAt: string;
  };
  updatedAt: string;
}

export interface StudyEvaluationResult {
  verdict: StudyVerdict;
  score: number;
  feedback: string;
  improvements: string[];
  evaluatedAt: string;
}

function toDTO(doc: {
  _id: unknown;
  question: unknown;
  content: string;
  evaluation?: {
    verdict: StudyVerdict;
    score: number;
    feedback: string;
    improvements: string[];
    evaluatedAt: Date;
  };
  updatedAt: Date;
}): StudyNoteDTO {
  return {
    _id: String(doc._id),
    questionId: String(doc.question),
    content: doc.content,
    evaluation: doc.evaluation
      ? {
          verdict: doc.evaluation.verdict,
          score: doc.evaluation.score,
          feedback: doc.evaluation.feedback,
          improvements: doc.evaluation.improvements,
          evaluatedAt: doc.evaluation.evaluatedAt.toISOString(),
        }
      : undefined,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

class StudyService {
  async getNote(userId: string, questionId: string): Promise<StudyNoteDTO | null> {
    const note = await studyNoteRepository.findByUserAndQuestion(userId, questionId);
    if (!note) return null;
    return toDTO(note as Parameters<typeof toDTO>[0]);
  }

  async listNotes(userId: string): Promise<StudyNoteDTO[]> {
    const notes = await studyNoteRepository.findByUser(userId);
    return notes.map((n) => toDTO(n as Parameters<typeof toDTO>[0]));
  }

  async saveNote(
    userId: string,
    questionId: string,
    content: string
  ): Promise<StudyNoteDTO> {
    const question = await questionRepository.findById(questionId);
    if (!question) throw new NotFoundError("Question");

    const note = await studyNoteRepository.upsert({
      user: userId,
      question: questionId,
      content,
    });
    return toDTO(note as Parameters<typeof toDTO>[0]);
  }

  async evaluateAnswer(
    userId: string,
    questionId: string,
    answer: string
  ): Promise<StudyEvaluationResult> {
    const trimmed = answer.trim();
    if (!trimmed) throw new ValidationError("Answer cannot be empty");

    const question = await questionRepository.findById(questionId);
    if (!question) throw new NotFoundError("Question");

    const topicName =
      typeof question.topic === "object" && question.topic
        ? (question.topic as unknown as ITopic).name
        : "General";

    const studyPrompt = getDefaultStudySystemPrompt();
    const userPrompt = buildStudyEvalUserPrompt({
      question: question.question,
      topic: topicName,
      difficulty: question.difficulty,
      userAnswer: trimmed,
    });

    let parsed;
    try {
      const content = await callAIEvaluation(studyPrompt, userPrompt);
      parsed = studyEvaluationSchema.parse(JSON.parse(content));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      console.error("[study.evaluateAnswer] evaluation failed:", error);
      throw new Error(`Answer evaluation failed: ${reason}`);
    }

    const evaluatedAt = new Date();
    const evaluation = {
      verdict: parsed.verdict,
      score: Math.round(parsed.score),
      feedback: parsed.feedback,
      improvements: parsed.improvements,
      evaluatedAt,
    };

    await studyNoteRepository.upsert({
      user: userId,
      question: questionId,
      content: trimmed,
      evaluation,
    });

    return {
      verdict: evaluation.verdict,
      score: evaluation.score,
      feedback: evaluation.feedback,
      improvements: evaluation.improvements,
      evaluatedAt: evaluatedAt.toISOString(),
    };
  }
}

export const studyService = new StudyService();
