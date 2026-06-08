import connectDB from "@/lib/db/mongoose";
import Topic, { type ITopicDocument } from "@/lib/db/models/Topic";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface CreateTopicDTO {
  name: string;
  slug: string;
  description?: string;
  parentTopic?: string;
  order?: number;
  icon?: string;
}

export type UpdateTopicDTO = Partial<CreateTopicDTO> & { questionCount?: number };

class TopicRepository implements IRepository<ITopicDocument, CreateTopicDTO, UpdateTopicDTO> {
  async findById(id: string): Promise<ITopicDocument | null> {
    await connectDB();
    return Topic.findById(id).lean() as unknown as Promise<ITopicDocument | null>;
  }

  async findBySlug(slug: string): Promise<ITopicDocument | null> {
    await connectDB();
    return Topic.findOne({ slug }).lean() as unknown as Promise<ITopicDocument | null>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<ITopicDocument[]> {
    await connectDB();
    const { sort = { order: 1, name: 1 } } = options;
    return Topic.find(filter).sort(sort).lean() as unknown as Promise<ITopicDocument[]>;
  }

  async findAllWithHierarchy(): Promise<ITopicDocument[]> {
    await connectDB();
    return Topic.find({}).sort({ order: 1 }).lean() as unknown as Promise<ITopicDocument[]>;
  }

  async create(dto: CreateTopicDTO): Promise<ITopicDocument> {
    await connectDB();
    const topic = await Topic.create(dto);
    return topic.toObject();
  }

  async update(id: string, dto: UpdateTopicDTO): Promise<ITopicDocument | null> {
    await connectDB();
    return Topic.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<ITopicDocument | null>;
  }

  async incrementQuestionCount(id: string, delta: number): Promise<void> {
    await connectDB();
    await Topic.findByIdAndUpdate(id, { $inc: { questionCount: delta } });
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await Topic.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return Topic.countDocuments(filter);
  }
}

export const topicRepository = new TopicRepository();
