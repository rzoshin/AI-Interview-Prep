import mongoose, { Document, Model, Schema } from "mongoose";

interface InterviewTurnSchema {
  question: mongoose.Types.ObjectId;
  userAnswer: string;
  score: number;
  feedback: string;
  improvements: string[];
  followUps: string[];
}

export interface IInterviewSessionDocument extends Document {
  user: mongoose.Types.ObjectId;
  turns: InterviewTurnSchema[];
  totalScore: number;
  status: "active" | "completed";
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TurnSubSchema = new Schema<InterviewTurnSchema>(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    userAnswer: { type: String, required: true },
    score: { type: Number, min: 0, max: 10, required: true },
    feedback: { type: String, required: true },
    improvements: [{ type: String }],
    followUps: [{ type: String }],
  },
  { _id: false }
);

const InterviewSessionSchema = new Schema<IInterviewSessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    turns: [TurnSubSchema],
    totalScore: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ user: 1, status: 1 });

const InterviewSession: Model<IInterviewSessionDocument> =
  mongoose.models?.InterviewSession ??
  mongoose.model<IInterviewSessionDocument>("InterviewSession", InterviewSessionSchema);

export default InterviewSession;
