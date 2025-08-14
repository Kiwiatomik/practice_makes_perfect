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
  FirestoreError
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Course, Lesson, User, Prompt } from '../types';

const COURSES_COLLECTION = 'course';
const LESSONS_COLLECTION = 'lesson';
const PROMPTS_COLLECTION = 'prompt';
const USER_PROGRESS_COLLECTION = 'userProgress';

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
    checkedByHuman: data.checkedByHuman || false,
    isGenerated: data.isGenerated || false,
    isGoodEnough: data.isGoodEnough || false,
    difficulty: data.difficulty || 'Easy',
    order: data.order || 0,
    text: data.text || '',
    answer: data.answer || undefined,
    workings: data.workings || undefined,
    subject: data.subject || undefined,
    level: data.level || undefined
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

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      // First try to get all courses to search their subcollections
      const coursesSnapshot = await getDocs(collection(db, COURSES_COLLECTION));
      
      // Search through each course's lesson subcollection
      for (const courseDoc of coursesSnapshot.docs) {
        try {
          const lessonDoc = await getDoc(
            doc(db, COURSES_COLLECTION, courseDoc.id, LESSONS_COLLECTION, lessonId)
          );
          
          if (lessonDoc.exists()) {
            const lesson = convertDocumentToLesson(lessonDoc as QueryDocumentSnapshot<DocumentData>);
            // Add courseId to the lesson object
            return { ...lesson, courseId: courseDoc.id };
          }
        } catch (error) {
          // Continue searching other courses
          console.warn(`Lesson ${lessonId} not found in course ${courseDoc.id}`);
        }
      }
      
      return null; // Lesson not found in any course
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
  }
};
