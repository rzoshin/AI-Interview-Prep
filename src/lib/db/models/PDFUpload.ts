import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPDFUploadDocument extends Document {
  uploadedBy: mongoose.Types.ObjectId;
  fileUrl: string;
  originalName: string;
  status: "pending" | "processing" | "done" | "failed";
  extractedCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PDFUploadSchema = new Schema<IPDFUploadDocument>(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
    },
    extractedCount: { type: Number, default: 0 },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

PDFUploadSchema.index({ uploadedBy: 1, status: 1 });

const PDFUpload: Model<IPDFUploadDocument> =
  mongoose.models?.PDFUpload ?? mongoose.model<IPDFUploadDocument>("PDFUpload", PDFUploadSchema);

export default PDFUpload;
