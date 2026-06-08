import connectDB from "@/lib/db/mongoose";
import AIAnswer, { type IAIAnswerDocument } from "@/lib/db/models/AIAnswer";
import type { IRepository } from "./base.repository";
import type { QuizQuestion } from "@/types";
import type { QueryOptions } from "@/types/api";

export interface CreateAIAnswerDTO {
  question: string;
  bangla_eli5: string;
  english_eli5: string;
  beginner_answer: string;
  interview_answer: string;
  senior_answer: string;
  code_example: string;
  common_mistakes: string[];
  follow_up_questions: string[];
  related_topics: string[];
  quiz_questions: QuizQuestion[];
  generatedBy: "gpt-5" | "claude" | "gemini";
  promptVersion: string;
}

export type UpdateAIAnswerDTO = Partial<CreateAIAnswerDTO>;

class AIAnswerRepository
  implements IRepository<IAIAnswerDocument, CreateAIAnswerDTO, UpdateAIAnswerDTO>
{
  async findById(id: string): Promise<IAIAnswerDocument | null> {
    await connectDB();
    return AIAnswer.findById(id).lean() as unknown as Promise<IAIAnswerDocument | null>;
  }

  async findByQuestionId(questionId: string): Promise<IAIAnswerDocument | null> {
    await connectDB();
    return AIAnswer.findOne({ question: questionId }).lean() as unknown as Promise<IAIAnswerDocument | null>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IAIAnswerDocument[]> {
    await connectDB();
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    return AIAnswer.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IAIAnswerDocument[]>;
  }

  async create(dto: CreateAIAnswerDTO): Promise<IAIAnswerDocument> {
    await connectDB();
    const answer = await AIAnswer.create(dto);
    return answer.toObject();
  }

  async upsert(questionId: string, dto: CreateAIAnswerDTO): Promise<IAIAnswerDocument> {
    await connectDB();
    const answer = await AIAnswer.findOneAndUpdate(
      { question: questionId },
      { $set: dto },
      { upsert: true, new: true }
    );
    return answer!.toObject();
  }

  async update(id: string, dto: UpdateAIAnswerDTO): Promise<IAIAnswerDocument | null> {
    await connectDB();
    return AIAnswer.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IAIAnswerDocument | null>;
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await AIAnswer.findByIdAndDelete(id);
    return !!result;
  }

  async deleteByQuestionId(questionId: string): Promise<boolean> {
    await connectDB();
    const result = await AIAnswer.findOneAndDelete({ question: questionId });
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return AIAnswer.countDocuments(filter);
  }
}

export const aiAnswerRepository = new AIAnswerRepository();
