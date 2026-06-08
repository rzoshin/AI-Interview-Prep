import connectDB from "@/lib/db/mongoose";
import Progress, { type IProgressDocument } from "@/lib/db/models/Progress";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface CreateProgressDTO {
  user: string;
}

export interface UpdateProgressDTO {
  completedQuestions?: string[];
  topicMastery?: Array<{ topic: string; score: number; lastActivity?: Date }>;
  weakAreas?: string[];
  strongAreas?: string[];
  readinessScore?: number;
  quizHistory?: Array<{ question: string; correct: boolean; timestamp?: Date }>;
}

class ProgressRepository
  implements IRepository<IProgressDocument, CreateProgressDTO, UpdateProgressDTO>
{
  async findById(id: string): Promise<IProgressDocument | null> {
    await connectDB();
    return Progress.findById(id).lean() as unknown as Promise<IProgressDocument | null>;
  }

  async findByUserId(userId: string): Promise<IProgressDocument | null> {
    await connectDB();
    return Progress.findOne({ user: userId })
      .populate("topicMastery.topic", "name slug")
      .lean() as unknown as Promise<IProgressDocument | null>;
  }

  async findOrCreate(userId: string): Promise<IProgressDocument> {
    await connectDB();
    const existing = await Progress.findOne({ user: userId });
    if (existing) return existing.toObject();
    const created = await Progress.create({ user: userId });
    return created.toObject();
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IProgressDocument[]> {
    await connectDB();
    const { page = 1, limit = 20 } = options;
    return Progress.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IProgressDocument[]>;
  }

  async create(dto: CreateProgressDTO): Promise<IProgressDocument> {
    await connectDB();
    const progress = await Progress.create(dto);
    return progress.toObject();
  }

  async update(id: string, dto: UpdateProgressDTO): Promise<IProgressDocument | null> {
    await connectDB();
    return Progress.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IProgressDocument | null>;
  }

  async addCompletedQuestion(userId: string, questionId: string): Promise<void> {
    await connectDB();
    await Progress.findOneAndUpdate(
      { user: userId },
      {
        $addToSet: { completedQuestions: questionId },
      },
      { upsert: true }
    );
  }

  async addQuizHistory(
    userId: string,
    entry: { question: string; correct: boolean }
  ): Promise<void> {
    await connectDB();
    await Progress.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          quizHistory: { ...entry, timestamp: new Date() },
        },
      },
      { upsert: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await Progress.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return Progress.countDocuments(filter);
  }
}

export const progressRepository = new ProgressRepository();
