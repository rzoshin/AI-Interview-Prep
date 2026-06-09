import mongoose, { Document, Model, Schema } from "mongoose";

export type StudyVerdict = "correct" | "partial" | "incorrect";

interface StudyEvaluationSchema {
  verdict: StudyVerdict;
  score: number;
  feedback: string;
  improvements: string[];
  evaluatedAt: Date;
}

export interface IStudyNoteDocument extends Document {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  content: string;
  evaluation?: StudyEvaluationSchema;
  createdAt: Date;
  updatedAt: Date;
}

const StudyEvaluationSubSchema = new Schema<StudyEvaluationSchema>(
  {
    verdict: {
      type: String,
      enum: ["correct", "partial", "incorrect"],
      required: true,
    },
    score: { type: Number, min: 0, max: 10, required: true },
    feedback: { type: String, default: "" },
    improvements: [{ type: String }],
    evaluatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const StudyNoteSchema = new Schema<IStudyNoteDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    content: { type: String, default: "" },
    evaluation: StudyEvaluationSubSchema,
  },
  { timestamps: true }
);

StudyNoteSchema.index({ user: 1, question: 1 }, { unique: true });

const StudyNote: Model<IStudyNoteDocument> =
  mongoose.models?.StudyNote ??
  mongoose.model<IStudyNoteDocument>("StudyNote", StudyNoteSchema);

export default StudyNote;
