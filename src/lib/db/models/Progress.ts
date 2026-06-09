import mongoose, { Document, Model, Schema } from "mongoose";

interface TopicMasterySchema {
  topic: mongoose.Types.ObjectId;
  score: number;
  lastActivity: Date;
}

interface QuizHistoryEntrySchema {
  question: mongoose.Types.ObjectId;
  correct: boolean;
  timestamp: Date;
}

export interface IProgressDocument extends Document {
  user: mongoose.Types.ObjectId;
  completedQuestions: mongoose.Types.ObjectId[];
  topicMastery: TopicMasterySchema[];
  weakAreas: mongoose.Types.ObjectId[];
  strongAreas: mongoose.Types.ObjectId[];
  readinessScore: number;
  quizHistory: QuizHistoryEntrySchema[];
  /** UTC calendar days (YYYY-MM-DD) with at least one study/quiz/interview activity. */
  activityDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TopicMasterySubSchema = new Schema<TopicMasterySchema>(
  {
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    score: { type: Number, min: 0, max: 100, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuizHistorySubSchema = new Schema<QuizHistoryEntrySchema>(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    correct: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProgressSchema = new Schema<IProgressDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    completedQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    topicMastery: [TopicMasterySubSchema],
    weakAreas: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
    strongAreas: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
    readinessScore: { type: Number, min: 0, max: 100, default: 0 },
    quizHistory: [QuizHistorySubSchema],
    activityDates: [{ type: String }],
  },
  { timestamps: true }
);

ProgressSchema.index({ user: 1 }, { unique: true });

const Progress: Model<IProgressDocument> =
  mongoose.models?.Progress ?? mongoose.model<IProgressDocument>("Progress", ProgressSchema);

export default Progress;
