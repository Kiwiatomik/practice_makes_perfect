export interface Question {
  id: string;
  answer: string;
  content: string;
  difficulty: number;
  subject: string;
  tags: string[];
}

export interface UserProgress {
  id: string;
  attempts: number;
  correct: boolean;
  questionId: string;
  timeSpent: number;
  timestamp: Date;
  userId: string;
}

export interface LearningPath {
  id: string;
  description: string;
  difficulty: number;
  name: string;
  questionIds: string[];
}

export interface User {
  id: string;
  createdAt: Date;
  displayName: string;
  email: string;
  lastActive: Date;
}

export interface Working {
  format: 'title' | 'paragraph';
  content: string;
}

export interface Prompt {
  id: string;
  abstractionLevel: number;  // 0 = original, 1+ = levels of abstraction
  answer?: string;
  answerType?: 'number' | 'equation';
  checkedByHuman?: boolean;  // Legacy field for backward compatibility
  createdAt: Date | any;  // Can be Firestore Timestamp or Date
  difficulty?: string;
  isGenerated?: boolean;  // Legacy field for backward compatibility
  isGoodEnough?: boolean;  // Legacy field for backward compatibility
  level?: string;
  order?: number;  // Legacy field for backward compatibility
  parentPromptId?: string;
  subject?: string;  // Legacy field for backward compatibility
  text: string;
  workings?: Working[];
}

export interface Lesson {
  id: string;
  content: string;
  courseId?: string; // Optional field for when lesson is fetched individually
  createdBy: User;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: number; // in minutes
  isCompleted?: boolean;
  order: number;
  title: string;
}

export interface Course {
  id: string;
  createdAt: Date;
  createdBy: User;
  description: string;
  isPublic: boolean;
  // lessons: Lesson[];
  level: 'High school' | 'Bachelor' | 'Master';
  subject: string;
  tags: string[];
  title: string;
  updatedAt: Date;
}

export interface UserAnswer {
  id: string;
  abstractionLevel: number; // 0 = original, 1+ = levels of abstraction
  attemptNumber: number; // for tracking multiple attempts
  correctAnswer?: string;
  courseRef: any; // DocumentReference to /course/{courseId}
  isCorrect: boolean;
  lessonRef: any; // DocumentReference to /course/{courseId}/lesson/{lessonId}
  promptRef: any; // DocumentReference to /course/{courseId}/lesson/{lessonId}/prompt/{promptId}
  submittedAt: Date | any; // Can be Firestore Timestamp or Date
  timeSpent?: number; // seconds from modal open to submission
  userAnswer: string;
  userId: string;
}
