import mongoose, { Document, Model, Schema } from "mongoose";

interface MilestoneSchema {
  topicId?: mongoose.Types.ObjectId;
  topicSlug: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
}

export interface IRoadmapDocument extends Document {
  user: mongoose.Types.ObjectId;
  level: "beginner" | "intermediate" | "advanced" | "interview-ready";
  summary: string;
  milestones: MilestoneSchema[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSubSchema = new Schema<MilestoneSchema>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
    topicSlug: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmapDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "interview-ready"],
      required: true,
    },
    summary: { type: String, default: "" },
    milestones: [MilestoneSubSchema],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Roadmap: Model<IRoadmapDocument> =
  mongoose.models?.Roadmap ?? mongoose.model<IRoadmapDocument>("Roadmap", RoadmapSchema);

export default Roadmap;
