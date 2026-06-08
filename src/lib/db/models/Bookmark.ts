import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBookmarkDocument extends Document {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmarkDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  },
  { timestamps: true }
);

BookmarkSchema.index({ user: 1, question: 1 }, { unique: true });

const Bookmark: Model<IBookmarkDocument> =
  mongoose.models?.Bookmark ?? mongoose.model<IBookmarkDocument>("Bookmark", BookmarkSchema);

export default Bookmark;
