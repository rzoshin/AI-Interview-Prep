import connectDB from "@/lib/db/mongoose";
import User, { type IUserDocument } from "@/lib/db/models/User";
import type { IRepository } from "./base.repository";
import type { QueryOptions } from "@/types/api";

export interface CreateUserDTO {
  name: string;
  email: string;
  hashedPassword?: string;
  role?: "user" | "admin";
  avatar?: string;
}

export interface UpdateUserDTO {
  name?: string;
  avatar?: string;
  role?: "user" | "admin";
  preferences?: {
    theme?: "light" | "dark" | "system";
    language?: "en" | "bn";
  };
}

class UserRepository implements IRepository<IUserDocument, CreateUserDTO, UpdateUserDTO> {
  async findById(id: string): Promise<IUserDocument | null> {
    await connectDB();
    return User.findById(id).lean() as unknown as Promise<IUserDocument | null>;
  }

  async findByEmail(email: string, includePassword = false): Promise<IUserDocument | null> {
    await connectDB();
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select("+hashedPassword");
    return query.lean() as unknown as Promise<IUserDocument | null>;
  }

  async findMany(
    filter: Record<string, unknown> = {},
    options: QueryOptions = {}
  ): Promise<IUserDocument[]> {
    await connectDB();
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    return User.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<IUserDocument[]>;
  }

  async create(dto: CreateUserDTO): Promise<IUserDocument> {
    await connectDB();
    const user = await User.create(dto);
    return user.toObject();
  }

  async update(id: string, dto: UpdateUserDTO): Promise<IUserDocument | null> {
    await connectDB();
    return User.findByIdAndUpdate(id, { $set: dto }, { new: true }).lean() as unknown as Promise<IUserDocument | null>;
  }

  async delete(id: string): Promise<boolean> {
    await connectDB();
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectDB();
    return User.countDocuments(filter);
  }
}

export const userRepository = new UserRepository();
