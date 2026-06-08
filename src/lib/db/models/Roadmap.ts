import mongoose, { Document, Model, Schema } from "mongoose";

interface MilestoneSchema {
  topicId: mongoose.Types.ObjectId;
  completed: boolean;
}

export interface IRoadmapDocument extends Document {
  user: mongoose.Types.ObjectId;
  level: "beginner" | "intermediate" | "advanced" | "interview-ready";
  milestones: MilestoneSchema[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSubSchema = new Schema<MilestoneSchema>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmapDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "interview-ready"],
      required: true,
    },
    milestones: [MilestoneSubSchema],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RoadmapSchema.index({ user: 1, level: 1 });

const Roadmap: Model<IRoadmapDocument> =
  mongoose.models?.Roadmap ?? mongoose.model<IRoadmapDocument>("Roadmap", RoadmapSchema);

export default Roadmap;
