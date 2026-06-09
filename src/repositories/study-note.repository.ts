import connectDB from "@/lib/db/mongoose";
import StudyNote, { type IStudyNoteDocument } from "@/lib/db/models/StudyNote";
import type { StudyVerdict } from "@/lib/db/models/StudyNote";

export interface StudyEvaluationDTO {
  verdict: StudyVerdict;
  score: number;
  feedback: string;
  improvements: string[];
  evaluatedAt: Date;
}

export interface UpsertStudyNoteDTO {
  user: string;
  question: string;
  content: string;
  evaluation?: StudyEvaluationDTO;
}

class StudyNoteRepository {
  async findByUserAndQuestion(
    userId: string,
    questionId: string
  ): Promise<IStudyNoteDocument | null> {
    await connectDB();
    return StudyNote.findOne({ user: userId, question: questionId }).lean() as unknown as Promise<IStudyNoteDocument | null>;
  }

  async findByUser(userId: string, limit = 100): Promise<IStudyNoteDocument[]> {
    await connectDB();
    return StudyNote.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean() as unknown as Promise<IStudyNoteDocument[]>;
  }

  async upsert(dto: UpsertStudyNoteDTO): Promise<IStudyNoteDocument> {
    await connectDB();
    const doc = await StudyNote.findOneAndUpdate(
      { user: dto.user, question: dto.question },
      {
        $set: {
          content: dto.content,
          ...(dto.evaluation ? { evaluation: dto.evaluation } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return doc as unknown as IStudyNoteDocument;
  }

  async setEvaluation(
    userId: string,
    questionId: string,
    evaluation: StudyEvaluationDTO
  ): Promise<IStudyNoteDocument | null> {
    await connectDB();
    return StudyNote.findOneAndUpdate(
      { user: userId, question: questionId },
      { $set: { evaluation } },
      { new: true }
    ).lean() as unknown as Promise<IStudyNoteDocument | null>;
  }
}

export const studyNoteRepository = new StudyNoteRepository();
