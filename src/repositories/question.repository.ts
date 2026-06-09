import connectDB from "@/lib/db/mongoose";
import Question, { type IQuestionDocument } from "@/lib/db/models/Question";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface CreateQuestionDTO {
  topic: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  tags?: string[];
  source?: string;
  isPublished?: boolean;
  contentHash?: string;
}

export type UpdateQuestionDTO = Partial<CreateQuestionDTO>;

export interface QuestionFilter {
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  isPublished?: boolean;
  search?: string;
}

class QuestionRepository implements IRepository<IQuestionDocument, CreateQuestionDTO, UpdateQuestionDTO> {
  async findById(id: string): Promise<IQuestionDocument | null> {
    await connectDB();
    return Question.findById(id).populate("topic").lean() as unknown as Promise<IQuestionDocument | null>;
  }

  async findByIds(ids: string[]): Promise<IQuestionDocument[]> {
    await connectDB();
    if (ids.length === 0) return [];
    return Question.find({ _id: { $in: ids } })
      .select("topic")
      .lean() as unknown as Promise<IQuestionDocument[]>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IQuestionDocument[]> {
    await connectDB();
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    return Question.find(filter)
      .populate("topic", "name slug")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IQuestionDocument[]>;
  }

  async findWithFilters(
    filter: QuestionFilter,
    options: QueryOptions = {}
  ): Promise<IQuestionDocument[]> {
    await connectDB();
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

    const query: Record<string, unknown> = {};
    if (filter.topic) query.topic = filter.topic;
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (filter.tags?.length) query.tags = { $in: filter.tags };
    if (filter.isPublished !== undefined) query.isPublished = filter.isPublished;
    if (filter.search) query.$text = { $search: filter.search };

    return Question.find(query)
      .populate("topic", "name slug")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IQuestionDocument[]>;
  }

  async findByHash(contentHash: string): Promise<IQuestionDocument | null> {
    await connectDB();
    return Question.findOne({ contentHash }).lean() as unknown as Promise<IQuestionDocument | null>;
  }

  async findSimilar(text: string, limit = 5): Promise<IQuestionDocument[]> {
    await connectDB();
    return Question.find(
      { $text: { $search: text }, isPublished: true },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean() as unknown as Promise<IQuestionDocument[]>;
  }

  async create(dto: CreateQuestionDTO): Promise<IQuestionDocument> {
    await connectDB();
    const question = await Question.create(dto);
    return question.toObject();
  }

  async bulkCreate(dtos: CreateQuestionDTO[]): Promise<IQuestionDocument[]> {
    await connectDB();
    const questions = await Question.insertMany(dtos, { ordered: false });
    return questions.map((q) => q.toObject());
  }

  async update(id: string, dto: UpdateQuestionDTO): Promise<IQuestionDocument | null> {
    await connectDB();
    return Question.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IQuestionDocument | null>;
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await Question.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return Question.countDocuments(filter);
  }
}

export const questionRepository = new QuestionRepository();
