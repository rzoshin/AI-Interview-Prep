import mongoose, { Document, Model, Schema } from "mongoose";

export interface IQuestionDocument extends Document {
  topic: mongoose.Types.ObjectId;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  source?: string;
  isPublished: boolean;
  contentHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestionDocument>(
  {
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    question: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    source: { type: String },
    isPublished: { type: Boolean, default: false },
    contentHash: { type: String, index: true },
  },
  { timestamps: true }
);

QuestionSchema.index({ topic: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ question: "text" });

const Question: Model<IQuestionDocument> =
  mongoose.models?.Question ?? mongoose.model<IQuestionDocument>("Question", QuestionSchema);

export default Question;
