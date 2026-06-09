import connectDB from "@/lib/db/mongoose";
import Roadmap, { type IRoadmapDocument } from "@/lib/db/models/Roadmap";
import type { RoadmapLevel } from "@/types";

export interface RoadmapMilestoneDTO {
  topicId?: string;
  topicSlug: string;
  title: string;
  description: string;
  order: number;
  completed?: boolean;
}

export interface UpsertRoadmapDTO {
  level: RoadmapLevel;
  summary: string;
  milestones: RoadmapMilestoneDTO[];
}

class RoadmapRepository {
  async findByUserId(userId: string): Promise<IRoadmapDocument | null> {
    await connectDB();
    return Roadmap.findOne({ user: userId }).lean() as unknown as Promise<IRoadmapDocument | null>;
  }

  // Replaces the user's roadmap (one doc per user) with a freshly generated one.
  async upsert(userId: string, dto: UpsertRoadmapDTO): Promise<IRoadmapDocument> {
    await connectDB();
    const updated = await Roadmap.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          level: dto.level,
          summary: dto.summary,
          milestones: dto.milestones.map((m) => ({
            topicId: m.topicId,
            topicSlug: m.topicSlug,
            title: m.title,
            description: m.description,
            order: m.order,
            completed: m.completed ?? false,
          })),
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).lean();
    return updated as unknown as IRoadmapDocument;
  }

  // Toggles the `completed` flag of the milestone at the given order index.
  async toggleMilestone(userId: string, order: number): Promise<IRoadmapDocument | null> {
    await connectDB();
    const doc = await Roadmap.findOne({ user: userId });
    if (!doc) return null;

    const milestone = doc.milestones.find((m) => m.order === order);
    if (!milestone) return null;

    milestone.completed = !milestone.completed;
    await doc.save();
    return doc.toObject() as unknown as IRoadmapDocument;
  }

  async delete(userId: string): Promise<boolean> {
    await connectDB();
    const result = await Roadmap.findOneAndDelete({ user: userId });
    return !!result;
  }
}

export const roadmapRepository = new RoadmapRepository();
