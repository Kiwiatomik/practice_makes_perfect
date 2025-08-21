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
  text: string;
  workings?: Working[];
  answer?: string;
  answerType?: 'number' | 'equation';
  level?: string;
  abstractionLevel: number;  // 0 = original, 1+ = levels of abstraction
  parentPromptId?: string;
  createdAt: Date | any;  // Can be Firestore Timestamp or Date
  difficulty?: string;
  // Legacy fields for backward compatibility
  checkedByHuman?: boolean;
  isGenerated?: boolean;
  isGoodEnough?: boolean;
  order?: number;
  subject?: string;
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

export interface UserAnswer {
  id: string;
  userId: string;
  courseRef: any; // DocumentReference to /course/{courseId}
  lessonRef: any; // DocumentReference to /course/{courseId}/lesson/{lessonId}
  promptRef: any; // DocumentReference to /course/{courseId}/lesson/{lessonId}/prompt/{promptId}
  abstractionLevel: number; // 0 = original, 1+ = levels of abstraction
  userAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  submittedAt: Date | any; // Can be Firestore Timestamp or Date
  timeSpent?: number; // seconds from modal open to submission
  attemptNumber: number; // for tracking multiple attempts
}
