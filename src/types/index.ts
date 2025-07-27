export interface Question {
  id: string;
  content: string;
  answer: string;
  difficulty: number;
  subject: string;
  tags: string[];
}

export interface UserProgress {
  userId: string;
  questionId: string;
  attempts: number;
  correct: boolean;
  timestamp: Date;
  timeSpent: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  questionIds: string[];
  difficulty: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastActive: Date;
}