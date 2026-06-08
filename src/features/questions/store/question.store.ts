import { create } from "zustand";
import type { Difficulty } from "@/types/index";

export interface QuestionFilters {
  topicId: string;
  difficulty: Difficulty | "";
  search: string;
  tags: string[];
  page: number;
  bookmarkedOnly: boolean;
}

interface QuestionStore extends QuestionFilters {
  setTopicId: (topicId: string) => void;
  setDifficulty: (difficulty: Difficulty | "") => void;
  setSearch: (search: string) => void;
  setTags: (tags: string[]) => void;
  setPage: (page: number) => void;
  setBookmarkedOnly: (bookmarkedOnly: boolean) => void;
  resetFilters: () => void;
}

const defaultFilters: QuestionFilters = {
  topicId: "",
  difficulty: "",
  search: "",
  tags: [],
  page: 1,
  bookmarkedOnly: false,
};

export const useQuestionStore = create<QuestionStore>((set) => ({
  ...defaultFilters,

  setTopicId: (topicId) => set({ topicId, page: 1 }),
  setDifficulty: (difficulty) => set({ difficulty, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setTags: (tags) => set({ tags, page: 1 }),
  setPage: (page) => set({ page }),
  setBookmarkedOnly: (bookmarkedOnly) => set({ bookmarkedOnly, page: 1 }),
  resetFilters: () => set({ ...defaultFilters }),
}));
