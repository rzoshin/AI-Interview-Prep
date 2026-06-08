import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPromptDocument extends Document {
  name: string;
  content: string;
  aiModel: "gpt-5" | "claude" | "gemini";
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema = new Schema<IPromptDocument>(
  {
    name: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    aiModel: { type: String, enum: ["gpt-5", "claude", "gemini"], required: true },
    version: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PromptSchema.index({ name: 1, isActive: 1 });

const Prompt: Model<IPromptDocument> =
  mongoose.models?.Prompt ?? mongoose.model<IPromptDocument>("Prompt", PromptSchema);

export default Prompt;
