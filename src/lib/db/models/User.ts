import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  hashedPassword?: string;
  role: "user" | "admin";
  avatar?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    language: "en" | "bn";
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hashedPassword: { type: String, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String },
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      language: { type: String, enum: ["en", "bn"], default: "en" },
    },
  },
  { timestamps: true }
);

// Index already defined via unique: true on the field above

const User: Model<IUserDocument> =
  mongoose.models?.User ?? mongoose.model<IUserDocument>("User", UserSchema);

export default User;
