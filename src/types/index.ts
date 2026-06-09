export type UserRole = "user" | "admin";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  hashedPassword?: string;
  role: UserRole;
  avatar?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    language: "en" | "bn";
  };
  createdAt: Date;
  updatedAt: Date;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface ITopic {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentTopic?: string;
  order: number;
  icon?: string;
  questionCount: number;
  createdAt: Date;
}

export interface IQuestion {
  _id: string;
  topic: string | ITopic;
  question: string;
  difficulty: Difficulty;
  tags: string[];
  source?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type AIModel = "gpt-5" | "claude" | "gemini" | "groq";

export interface IAIAnswer {
  _id: string;
  question: string | IQuestion;
  bangla_eli5: string;
  english_eli5: string;
  beginner_answer: string;
  interview_answer: string;
  senior_answer: string;
  code_example: string;
  common_mistakes: string[];
  follow_up_questions: string[];
  related_topics: string[];
  quiz_questions: QuizQuestion[];
  generatedBy: AIModel;
  promptVersion: string;
  createdAt: Date;
}

export interface InterviewTurn {
  question: string | IQuestion;
  userAnswer: string;
  score: number;
  feedback: string;
  improvements: string[];
  followUps: string[];
}

export interface IInterviewSession {
  _id: string;
  user: string | IUser;
  turns: InterviewTurn[];
  totalScore: number;
  status: "active" | "completed";
  startedAt: Date;
  completedAt?: Date;
}

// A question served to the client during an interview (client drives the queue).
export interface InterviewQuestion {
  _id: string;
  question: string;
  difficulty: Difficulty;
  topic: string;
}

// The per-answer evaluation returned to the client after submitting an answer.
export interface InterviewEvaluationResult {
  questionId: string;
  score: number;
  feedback: string;
  improvements: string[];
  followUps: string[];
}

export interface TopicMastery {
  topic: string | ITopic;
  score: number;
  lastActivity: Date;
}

export interface QuizHistoryEntry {
  question: string | IQuestion;
  correct: boolean;
  timestamp: Date;
}

export interface IProgress {
  _id: string;
  user: string | IUser;
  completedQuestions: string[];
  topicMastery: TopicMastery[];
  weakAreas: string[];
  strongAreas: string[];
  readinessScore: number;
  quizHistory: QuizHistoryEntry[];
}

export interface RoadmapMilestone {
  topicId: string;
  completed: boolean;
}

export type RoadmapLevel = "beginner" | "intermediate" | "advanced" | "interview-ready";

export interface IRoadmap {
  _id: string;
  user: string | IUser;
  level: RoadmapLevel;
  milestones: RoadmapMilestone[];
  generatedAt: Date;
}

export interface IBookmark {
  _id: string;
  user: string | IUser;
  question: string | IQuestion;
  createdAt: Date;
}

export type PDFUploadStatus = "pending" | "processing" | "done" | "failed";

export interface IPDFUpload {
  _id: string;
  uploadedBy: string | IUser;
  fileUrl: string;
  originalName: string;
  status: PDFUploadStatus;
  extractedCount: number;
  createdAt: Date;
}

export interface IPrompt {
  _id: string;
  name: string;
  content: string;
  model: AIModel;
  version: string;
  isActive: boolean;
  createdAt: Date;
}
