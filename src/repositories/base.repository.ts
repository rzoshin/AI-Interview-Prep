import type { QueryOptions } from "@/types/api";

export interface IRepository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<T | null>;
  findMany(filter: Record<string, unknown>, options?: QueryOptions): Promise<T[]>;
  create(dto: CreateDTO): Promise<T>;
  update(id: string, dto: UpdateDTO): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter: Record<string, unknown>): Promise<number>;
}
