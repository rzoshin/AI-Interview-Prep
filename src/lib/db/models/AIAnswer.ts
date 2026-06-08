import mongoose, { Document, Model, Schema } from "mongoose";

interface QuizQuestionSchema {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IAIAnswerDocument extends Document {
  question: mongoose.Types.ObjectId;
  bangla_eli5: string;
  english_eli5: string;
  beginner_answer: string;
  interview_answer: string;
  senior_answer: string;
  code_example: string;
  common_mistakes: string[];
  follow_up_questions: string[];
  related_topics: string[];
  quiz_questions: QuizQuestionSchema[];
  generatedBy: "gpt-5" | "claude" | "gemini" | "groq";
  promptVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSubSchema = new Schema<QuizQuestionSchema>(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const AIAnswerSchema = new Schema<IAIAnswerDocument>(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true, unique: true },
    bangla_eli5: { type: String, default: "" },
    english_eli5: { type: String, default: "" },
    beginner_answer: { type: String, default: "" },
    interview_answer: { type: String, default: "" },
    senior_answer: { type: String, default: "" },
    code_example: { type: String, default: "" },
    common_mistakes: [{ type: String }],
    follow_up_questions: [{ type: String }],
    related_topics: [{ type: String }],
    quiz_questions: [QuizQuestionSubSchema],
    generatedBy: { type: String, enum: ["gpt-5", "claude", "gemini", "groq"], required: true },
    promptVersion: { type: String, required: true },
  },
  { timestamps: true }
);

AIAnswerSchema.index({ question: 1 }, { unique: true });

const AIAnswer: Model<IAIAnswerDocument> =
  mongoose.models?.AIAnswer ?? mongoose.model<IAIAnswerDocument>("AIAnswer", AIAnswerSchema);

export default AIAnswer;
