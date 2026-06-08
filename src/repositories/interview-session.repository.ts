import connectDB from "@/lib/db/mongoose";
import InterviewSession, {
  type IInterviewSessionDocument,
} from "@/lib/db/models/InterviewSession";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface InterviewTurnDTO {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  improvements: string[];
  followUps: string[];
}

export interface CreateInterviewSessionDTO {
  user: string;
}

export interface UpdateInterviewSessionDTO {
  turns?: InterviewTurnDTO[];
  totalScore?: number;
  status?: "active" | "completed";
  completedAt?: Date;
}

class InterviewSessionRepository
  implements
    IRepository<
      IInterviewSessionDocument,
      CreateInterviewSessionDTO,
      UpdateInterviewSessionDTO
    >
{
  async findById(id: string): Promise<IInterviewSessionDocument | null> {
    await connectDB();
    return InterviewSession.findById(id)
      .populate("turns.question", "question difficulty")
      .lean() as unknown as Promise<IInterviewSessionDocument | null>;
  }

  async findActiveByUserId(userId: string): Promise<IInterviewSessionDocument | null> {
    await connectDB();
    return InterviewSession.findOne({ user: userId, status: "active" }).lean() as unknown as Promise<IInterviewSessionDocument | null>;
  }

  async findByUser(
    userId: string,
    options: QueryOptions = {}
  ): Promise<IInterviewSessionDocument[]> {
    await connectDB();
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    return InterviewSession.find({ user: userId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IInterviewSessionDocument[]>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IInterviewSessionDocument[]> {
    await connectDB();
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    return InterviewSession.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IInterviewSessionDocument[]>;
  }

  async create(dto: CreateInterviewSessionDTO): Promise<IInterviewSessionDocument> {
    await connectDB();
    const session = await InterviewSession.create(dto);
    return session.toObject();
  }

  async addTurn(sessionId: string, turn: InterviewTurnDTO): Promise<IInterviewSessionDocument | null> {
    await connectDB();
    return InterviewSession.findByIdAndUpdate(
      sessionId,
      { $push: { turns: turn } },
      { new: true }
    ).lean() as unknown as Promise<IInterviewSessionDocument | null>;
  }

  async update(
    id: string,
    dto: UpdateInterviewSessionDTO
  ): Promise<IInterviewSessionDocument | null> {
    await connectDB();
    return InterviewSession.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IInterviewSessionDocument | null>;
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await InterviewSession.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return InterviewSession.countDocuments(filter);
  }
}

export const interviewSessionRepository = new InterviewSessionRepository();
