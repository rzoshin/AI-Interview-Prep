import connectDB from "@/lib/db/mongoose";
import PDFUpload, { type IPDFUploadDocument } from "@/lib/db/models/PDFUpload";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface CreatePDFUploadDTO {
  uploadedBy: string;
  fileUrl: string;
  originalName: string;
}

export interface UpdatePDFUploadDTO {
  status?: "pending" | "processing" | "done" | "failed";
  extractedCount?: number;
  errorMessage?: string;
}

class PDFUploadRepository
  implements IRepository<IPDFUploadDocument, CreatePDFUploadDTO, UpdatePDFUploadDTO>
{
  async findById(id: string): Promise<IPDFUploadDocument | null> {
    await connectDB();
    return PDFUpload.findById(id).lean() as unknown as Promise<IPDFUploadDocument | null>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IPDFUploadDocument[]> {
    await connectDB();
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    return PDFUpload.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IPDFUploadDocument[]>;
  }

  async create(dto: CreatePDFUploadDTO): Promise<IPDFUploadDocument> {
    await connectDB();
    const upload = await PDFUpload.create(dto);
    return upload.toObject();
  }

  async update(id: string, dto: UpdatePDFUploadDTO): Promise<IPDFUploadDocument | null> {
    await connectDB();
    return PDFUpload.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IPDFUploadDocument | null>;
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await PDFUpload.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return PDFUpload.countDocuments(filter);
  }
}

export const pdfUploadRepository = new PDFUploadRepository();
