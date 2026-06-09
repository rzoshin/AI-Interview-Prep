import connectDB from "@/lib/db/mongoose";
import Prompt, { type IPromptDocument } from "@/lib/db/models/Prompt";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface CreatePromptDTO {
  name: string;
  content: string;
  aiModel: "gpt-5" | "claude" | "gemini";
  version: string;
  isActive?: boolean;
}

export interface UpdatePromptDTO {
  content?: string;
  aiModel?: "gpt-5" | "claude" | "gemini";
  version?: string;
  isActive?: boolean;
}

class PromptRepository implements IRepository<IPromptDocument, CreatePromptDTO, UpdatePromptDTO> {
  async findById(id: string): Promise<IPromptDocument | null> {
    await connectDB();
    return Prompt.findById(id).lean() as unknown as Promise<IPromptDocument | null>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IPromptDocument[]> {
    await connectDB();
    const { page = 1, limit = 100, sort = { name: 1, createdAt: -1 } } = options;
    return Prompt.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IPromptDocument[]>;
  }

  async findActiveByName(name: string): Promise<IPromptDocument | null> {
    await connectDB();
    return Prompt.findOne({ name, isActive: true })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<IPromptDocument | null>;
  }

  async findLatestVersion(name: string): Promise<string | null> {
    await connectDB();
    const latest = await Prompt.findOne({ name }).sort({ createdAt: -1 }).select("version").lean();
    return latest?.version ?? null;
  }

  async create(dto: CreatePromptDTO): Promise<IPromptDocument> {
    await connectDB();
    if (dto.isActive !== false) {
      await Prompt.updateMany({ name: dto.name }, { $set: { isActive: false } });
    }
    const doc = await Prompt.create({ ...dto, isActive: dto.isActive ?? true });
    return doc.toObject();
  }

  async update(id: string, dto: UpdatePromptDTO): Promise<IPromptDocument | null> {
    await connectDB();
    const existing = await Prompt.findById(id);
    if (!existing) return null;

    if (dto.isActive === true) {
      await Prompt.updateMany(
        { name: existing.name, _id: { $ne: id } },
        { $set: { isActive: false } }
      );
    }

    return Prompt.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IPromptDocument | null>;
  }

  async deactivateOthers(name: string, keepId: string): Promise<void> {
    await connectDB();
    await Prompt.updateMany({ name, _id: { $ne: keepId } }, { $set: { isActive: false } });
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await Prompt.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return Prompt.countDocuments(filter);
  }
}

export const promptRepository = new PromptRepository();
