import connectDB from "@/lib/db/mongoose";
import Bookmark, { type IBookmarkDocument } from "@/lib/db/models/Bookmark";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface CreateBookmarkDTO {
  user: string;
  question: string;
}

class BookmarkRepository
  implements IRepository<IBookmarkDocument, CreateBookmarkDTO, Partial<CreateBookmarkDTO>>
{
  async findById(id: string): Promise<IBookmarkDocument | null> {
    await connectDB();
    return Bookmark.findById(id).lean() as unknown as Promise<IBookmarkDocument | null>;
  }

  async findByUserAndQuestion(
    userId: string,
    questionId: string
  ): Promise<IBookmarkDocument | null> {
    await connectDB();
    return Bookmark.findOne({ user: userId, question: questionId }).lean() as unknown as Promise<IBookmarkDocument | null>;
  }

  async findByUser(userId: string, options: QueryOptions = {}): Promise<IBookmarkDocument[]> {
    await connectDB();
    const { page = 1, limit = 20 } = options;
    return Bookmark.find({ user: userId })
      .populate({ path: "question", populate: { path: "topic", select: "name slug" } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IBookmarkDocument[]>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IBookmarkDocument[]> {
    await connectDB();
    const { page = 1, limit = 20 } = options;
    return Bookmark.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IBookmarkDocument[]>;
  }

  async create(dto: CreateBookmarkDTO): Promise<IBookmarkDocument> {
    await connectDB();
    const bookmark = await Bookmark.create(dto);
    return bookmark.toObject();
  }

  async update(
    id: string,
    dto: Partial<CreateBookmarkDTO>
  ): Promise<IBookmarkDocument | null> {
    await connectDB();
    return Bookmark.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IBookmarkDocument | null>;
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await Bookmark.findByIdAndDelete(id);
    return !!result;
  }

  async deleteByUserAndQuestion(userId: string, questionId: string): Promise<boolean> {
    await connectDB();
    const result = await Bookmark.findOneAndDelete({ user: userId, question: questionId });
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return Bookmark.countDocuments(filter);
  }
}

export const bookmarkRepository = new BookmarkRepository();
