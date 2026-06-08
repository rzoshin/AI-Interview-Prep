import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITopicDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  parentTopic?: mongoose.Types.ObjectId;
  order: number;
  icon?: string;
  questionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopicDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    parentTopic: { type: Schema.Types.ObjectId, ref: "Topic" },
    order: { type: Number, default: 0 },
    icon: { type: String },
    questionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TopicSchema.index({ slug: 1 }, { unique: true });

const Topic: Model<ITopicDocument> =
  mongoose.models?.Topic ?? mongoose.model<ITopicDocument>("Topic", TopicSchema);

export default Topic;
