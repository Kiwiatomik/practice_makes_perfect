import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreError,
  Timestamp,
  serverTimestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Course, Lesson, User, Prompt, UserAnswer } from '../types';

const COURSES_COLLECTION = 'course';
const LESSONS_COLLECTION = 'lesson';
const PROMPTS_COLLECTION = 'prompt';
const USER_PROGRESS_COLLECTION = 'userProgress';
const USER_COLLECTION = 'user';
const USER_ANSWERS_COLLECTION = 'answer';

const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
};

const convertDocumentToCourse = (doc: QueryDocumentSnapshot<DocumentData>): Course => {
  const data = doc.data();
  
  return {
    id: doc.id,
    title: data.title || '',
    description: data.description || '',
    createdBy: {
      id: data.createdBy?.id || '',
      email: data.createdBy?.email || '',
      displayName: data.createdBy?.displayName || '',
      createdAt: convertTimestamp(data.createdBy?.createdAt),
      lastActive: convertTimestamp(data.createdBy?.lastActive)
    },
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    level: data.level || 'Bachelor',
    subject: data.subject || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    lessons: [], // Lessons will be fetched separately from subcollection
    isPublic: data.isPublic !== false
  };
};

const convertDocumentToLesson = (doc: QueryDocumentSnapshot<DocumentData>): Lesson => {
  const data = doc.data();
  
  return {
    id: doc.id,
    title: data.title || '',
    description: data.description || '',
    createdBy: {
      id: data.createdBy?.id || '',
      email: data.createdBy?.email || '',
      displayName: data.createdBy?.displayName || '',
      createdAt: convertTimestamp(data.createdBy?.createdAt),
      lastActive: convertTimestamp(data.createdBy?.lastActive)
    },
    content: data.content || '',
    order: data.order || 0,
    duration: data.duration || 0,
    difficulty: data.difficulty || 'Easy',
    isCompleted: data.isCompleted || false
  };
};

const convertDocumentToPrompt = (doc: QueryDocumentSnapshot<DocumentData>): Prompt => {
  const data = doc.data();
  
  return {
    id: doc.id,
    text: data.text || '',
    workings: data.workings || undefined,
    answer: data.answer || undefined,
    answerType: data.answerType || '',
    level: data.level || undefined,
    abstractionLevel: data.abstractionLevel || 0,
    parentPromptId: data.parentPromptId || undefined,
    createdAt: convertTimestamp(data.createdAt),
    difficulty: data.difficulty || undefined,
    // Legacy fields for backward compatibility
    checkedByHuman: data.checkedByHuman || false,
    isGenerated: data.isGenerated || false,
    isGoodEnough: data.isGoodEnough || false,
    order: data.order || 0,
    subject: data.subject || undefined
  };
};

export interface CourseFilters {
  searchTerm?: string;
  subject?: string;
  level?: string;
  isPublic?: boolean;
}

export const coursesService = {
  async getAllCourses(filters?: CourseFilters): Promise<Course[]> {
    try {
      let coursesQuery = query(collection(db, COURSES_COLLECTION));
      
      // Only add isPublic filter if specified, otherwise get all courses
      if (filters?.isPublic !== undefined) {
        coursesQuery = query(coursesQuery, where('isPublic', '==', filters.isPublic));
      }
      
      // Get all courses first, then filter client-side to avoid complex indexes
      const querySnapshot = await getDocs(coursesQuery);
      let courses = querySnapshot.docs.map(convertDocumentToCourse);
      
      // Skip fetching lessons for the courses list to reduce database calls
      
      // Apply filters client-side
      if (filters?.subject) {
        courses = courses.filter(course => course.subject === filters.subject);
      }
      
      if (filters?.level) {
        courses = courses.filter(course => course.level === filters.level);
      }
      
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        courses = courses.filter(course => 
          course.title.toLowerCase().includes(searchLower) ||
          course.description.toLowerCase().includes(searchLower) ||
          course.createdBy.displayName.toLowerCase().includes(searchLower) ||
          course.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      // Sort by creation date (newest first)
      courses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return courses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const courseDoc = await getDoc(doc(db, COURSES_COLLECTION, courseId));
      
      if (!courseDoc.exists()) {
        return null;
      }
      
      let course = convertDocumentToCourse(courseDoc as QueryDocumentSnapshot<DocumentData>);
      
      // Fetch lessons from subcollection
      try {
        const lessons = await this.getLessonsByCourseId(courseId);
        course = { ...course, lessons };
      } catch (error) {
        console.warn('Could not fetch lessons for course:', courseId, error);
        // Continue with empty lessons array
      }
      
      return course;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course');
    }
  },

  async getLessonById(courseId: string, lessonId: string): Promise<Lesson | null> {
    try {
      const lessonDoc = await getDoc(
        doc(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId)
      );
      
      if (lessonDoc.exists()) {
        const lesson = convertDocumentToLesson(lessonDoc as QueryDocumentSnapshot<DocumentData>);
        // Add courseId to the lesson object
        return { ...lesson, courseId };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw new Error('Failed to fetch lesson');
    }
  },

  async getLessonsByCourseId(courseId: string): Promise<Lesson[]> {
    try {
      // Lessons are stored as subcollections under each course
      const lessonsQuery = collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION);
      
      const querySnapshot = await getDocs(lessonsQuery);
      const lessons = querySnapshot.docs.map(convertDocumentToLesson);
      
      return lessons;
    } catch (error) {
      console.error('Error fetching lessons for course:', courseId, error);
      throw new Error('Failed to fetch course lessons');
    }
  },

  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COURSES_COLLECTION), {
        ...courseData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating course:', error);
      throw new Error('Failed to create course');
    }
  },

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<void> {
    try {
      const courseRef = doc(db, COURSES_COLLECTION, courseId);
      await updateDoc(courseRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating course:', error);
      throw new Error('Failed to update course');
    }
  },

  async deleteCourse(courseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COURSES_COLLECTION, courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  },

  async createLesson(lessonData: Omit<Lesson, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, LESSONS_COLLECTION), lessonData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw new Error('Failed to create lesson');
    }
  },

  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<void> {
    try {
      const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
      await updateDoc(lessonRef, updates);
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw new Error('Failed to update lesson');
    }
  },

  async deleteLesson(lessonId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, LESSONS_COLLECTION, lessonId));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw new Error('Failed to delete lesson');
    }
  },

  async markLessonComplete(userId: string, lessonId: string, courseId: string): Promise<void> {
    try {
      const progressRef = doc(db, USER_PROGRESS_COLLECTION, `${userId}_${lessonId}`);
      await updateDoc(progressRef, {
        userId,
        lessonId,
        courseId,
        isCompleted: true,
        completedAt: new Date()
      });
    } catch (error) {
      if ((error as FirestoreError).code === 'not-found') {
        await addDoc(collection(db, USER_PROGRESS_COLLECTION), {
          userId,
          lessonId,
          courseId,
          isCompleted: true,
          completedAt: new Date()
        });
      } else {
        console.error('Error marking lesson complete:', error);
        throw new Error('Failed to mark lesson as complete');
      }
    }
  },

  async getUserProgress(userId: string, courseId?: string): Promise<Record<string, boolean>> {
    try {
      let progressQuery = query(
        collection(db, USER_PROGRESS_COLLECTION),
        where('userId', '==', userId)
      );
      
      if (courseId) {
        progressQuery = query(progressQuery, where('courseId', '==', courseId));
      }
      
      const querySnapshot = await getDocs(progressQuery);
      const progress: Record<string, boolean> = {};
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        progress[data.lessonId] = data.isCompleted || false;
      });
      
      return progress;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch user progress');
    }
  },

  async getPromptsByLessonId(courseId: string, lessonId: string): Promise<Prompt[]> {
    try {
      // Prompts are stored as subcollections under lessons: /course/{courseId}/lesson/{lessonId}/prompt/{promptId}
      const promptsQuery = query(
        collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId, PROMPTS_COLLECTION),
        orderBy('order', 'asc')
      );
      
      const querySnapshot = await getDocs(promptsQuery);
      return querySnapshot.docs.map(convertDocumentToPrompt);
    } catch (error) {
      console.error('Error fetching prompts for lesson:', error);
      throw new Error('Failed to fetch lesson prompts');
    }
  },

  async getFirstPromptByLessonId(courseId: string, lessonId: string): Promise<Prompt | null> {
    try {
      // Get the first prompt (order = 0 or lowest order)
      const promptsQuery = query(
        collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId, PROMPTS_COLLECTION),
        orderBy('order', 'asc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(promptsQuery);
      if (querySnapshot.empty) {
        return null;
      }
      
      return convertDocumentToPrompt(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error fetching first prompt for lesson:', error);
      throw new Error('Failed to fetch lesson prompt');
    }
  },

  async createPrompt(courseId: string, lessonId: string, promptData: Omit<Prompt, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('Creating prompt in collection path:', `${COURSES_COLLECTION}/${courseId}/${LESSONS_COLLECTION}/${lessonId}/${PROMPTS_COLLECTION}`);
      console.log('Prompt data before Firebase:', JSON.stringify(promptData, null, 2));
      
      // Sanitize data to remove undefined values
      const sanitizedData = JSON.parse(JSON.stringify({
        ...promptData,
        createdAt: serverTimestamp()
      }));
      
      console.log('Sanitized data for Firebase:', JSON.stringify(sanitizedData, null, 2));
      
      const docRef = await addDoc(
        collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId, PROMPTS_COLLECTION),
        sanitizedData
      );
      return docRef.id;
    } catch (error) {
      console.error('Error creating prompt:', error);
      console.error('Course ID:', courseId, 'Lesson ID:', lessonId);
      console.error('Original prompt data:', promptData);
      throw new Error(`Failed to create prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async createMultiplePrompts(courseId: string, lessonId: string, prompts: Omit<Prompt, 'id' | 'createdAt'>[]): Promise<string[]> {
    try {
      const promptIds: string[] = [];
      console.log('Creating multiple prompts:', { courseId, lessonId, count: prompts.length });
      
      for (const promptData of prompts) {
        const docRef = await addDoc(
          collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId, PROMPTS_COLLECTION),
          {
            ...promptData,
            createdAt: serverTimestamp()
          }
        );
        promptIds.push(docRef.id);
      }
      
      console.log('Successfully created prompt IDs:', promptIds);
      return promptIds;
    } catch (error) {
      console.error('Error creating multiple prompts:', error);
      throw new Error(`Failed to create prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // User Answer Recording Functions
  async recordUserAnswer(
    userId: string, 
    courseId: string, 
    lessonId: string, 
    promptId: string,
    answerData: Omit<UserAnswer, 'id' | 'userId' | 'courseRef' | 'lessonRef' | 'promptRef' | 'submittedAt' | 'attemptNumber'>
  ): Promise<string> {
    try {
      // Create references to course, lesson, and prompt documents
      const courseRef = doc(db, COURSES_COLLECTION, courseId);
      const lessonRef = doc(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId);
      const promptRef = doc(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId, PROMPTS_COLLECTION, promptId);
      
      // Get existing attempts for this user and prompt to calculate attempt number
      const existingAnswers = await this.getUserAnswersForPrompt(userId, courseId, lessonId, promptId);
      const maxAttemptNumber = existingAnswers.length > 0 
        ? Math.max(...existingAnswers.map(answer => answer.attemptNumber))
        : 0;
      const attemptNumber = maxAttemptNumber + 1;
      
      console.log('Calculating attempt number:', {
        existingAnswers: existingAnswers.length,
        maxAttemptNumber,
        newAttemptNumber: attemptNumber
      });
      
      const docRef = await addDoc(
        collection(db, USER_COLLECTION, userId, USER_ANSWERS_COLLECTION),
        {
          ...answerData,
          courseRef,
          lessonRef,
          promptRef,
          attemptNumber,
          submittedAt: serverTimestamp()
        }
      );
      
      console.log('User answer recorded:', { 
        userId, 
        courseId, 
        lessonId, 
        promptId, 
        attemptNumber, 
        abstractionLevel: answerData.abstractionLevel,
        answerId: docRef.id 
      });
      return docRef.id;
    } catch (error) {
      console.error('Error recording user answer:', error);
      throw new Error(`Failed to record answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getUserAnswers(userId: string): Promise<UserAnswer[]> {
    try {
      const snapshot = await getDocs(
        collection(db, USER_COLLECTION, userId, USER_ANSWERS_COLLECTION)
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        userId,
        ...doc.data(),
        submittedAt: convertTimestamp(doc.data().submittedAt)
      } as UserAnswer));
    } catch (error) {
      console.error('Error fetching user answers:', error);
      throw new Error('Failed to fetch user answers');
    }
  },

  async getUserAnswersForPrompt(userId: string, courseId: string, lessonId: string, promptId: string): Promise<UserAnswer[]> {
    try {
      const answers = await this.getUserAnswers(userId);
      return answers.filter(answer => {
        // Check if the prompt reference matches our target prompt
        const promptRefPath = answer.promptRef?.path;
        return promptRefPath?.includes(courseId) && promptRefPath?.includes(lessonId) && promptRefPath?.includes(promptId);
      });
    } catch (error) {
      console.error('Error fetching user answers for prompt:', error);
      throw new Error('Failed to fetch prompt answers');
    }
  },

  async getUserAnswersForLesson(userId: string, courseId: string, lessonId: string): Promise<UserAnswer[]> {
    try {
      const answers = await this.getUserAnswers(userId);
      // We can't directly filter by reference, so we'll need to check the reference paths
      return answers.filter(answer => {
        // Check if the references match our course and lesson
        const courseRefPath = answer.courseRef?.path;
        const lessonRefPath = answer.lessonRef?.path;
        return courseRefPath?.includes(courseId) && lessonRefPath?.includes(lessonId);
      });
    } catch (error) {
      console.error('Error fetching user answers for lesson:', error);
      throw new Error('Failed to fetch lesson answers');
    }
  }
};
