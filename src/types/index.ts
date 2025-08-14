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

export interface Working {
  format: 'title' | 'paragraph';
  content: string;
}

export interface Prompt {
  id: string;
  checkedByHuman: boolean;
  isGenerated: boolean;
  isGoodEnough: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  order: number;
  text: string;
  answer?: string;
  workings?: Working[];
  subject?: string;
  level?: 'Easy' | 'Medium' | 'Hard';
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  content: string;
  order: number;
  duration: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isCompleted?: boolean;
  courseId?: string; // Optional field for when lesson is fetched individually
}

export interface Course {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  level: 'High school' | 'Bachelor' | 'Master';
  subject: string;
  tags: string[];
  lessons: Lesson[];
  isPublic: boolean;
}
