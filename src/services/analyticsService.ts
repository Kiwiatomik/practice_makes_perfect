import { logEvent, setUserProperties } from 'firebase/analytics';
import { analytics } from '../config/firebase';

export interface AnalyticsEvent {
  event_name: string;
  parameters?: Record<string, any>;
}

class AnalyticsService {
  private isEnabled = () => {
    return analytics && !import.meta.env.DEV;
  };

  // User tracking
  setUserProperties(properties: Record<string, any>) {
    if (!this.isEnabled()) return;

    try {
      setUserProperties(analytics, properties);
    } catch (error) {
      console.error('Analytics - Failed to set user properties:', error);
    }
  }

  // Course and lesson events
  trackCourseView(courseId: string, courseName: string) {
    this.logEvent('course_view', {
      course_id: courseId,
      course_name: courseName,
    });
  }

  trackLessonStart(courseId: string, lessonId: string, lessonName: string) {
    this.logEvent('lesson_start', {
      course_id: courseId,
      lesson_id: lessonId,
      lesson_name: lessonName,
    });
  }

  trackLessonComplete(courseId: string, lessonId: string, timeSpent: number) {
    this.logEvent('lesson_complete', {
      course_id: courseId,
      lesson_id: lessonId,
      time_spent_seconds: timeSpent,
    });
  }

  // AI interaction events
  trackQuestionGeneration(lessonId: string, questionType: 'practice_again' | 'next_level', success: boolean) {
    this.logEvent('ai_question_generated', {
      lesson_id: lessonId,
      question_type: questionType,
      success: success,
    });
  }

  trackAnswerSubmission(lessonId: string, questionId: string, isCorrect?: boolean) {
    this.logEvent('answer_submitted', {
      lesson_id: lessonId,
      question_id: questionId,
      is_correct: isCorrect,
    });
  }

  // Authentication events
  trackSignUp(method: 'email' | 'google') {
    this.logEvent('sign_up', {
      method: method,
    });
  }

  trackLogin(method: 'email' | 'google') {
    this.logEvent('login', {
      method: method,
    });
  }

  trackLogout() {
    this.logEvent('logout');
  }

  // Course creation (admin)
  trackCourseCreation(courseId: string) {
    this.logEvent('course_created', {
      course_id: courseId,
    });
  }

  trackLessonCreation(courseId: string, lessonId: string) {
    this.logEvent('lesson_created', {
      course_id: courseId,
      lesson_id: lessonId,
    });
  }

  // Error tracking
  trackError(errorType: string, errorMessage: string, context?: Record<string, any>) {
    this.logEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  }

  // Performance events
  trackPageLoad(pageName: string, loadTime: number) {
    this.logEvent('page_load_time', {
      page_name: pageName,
      load_time_ms: loadTime,
    });
  }

  // Generic event logging
  private logEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (!this.isEnabled()) {
      console.log(`Analytics (dev): ${eventName}`, parameters);
      return;
    }

    try {
      logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.error(`Analytics - Failed to log event ${eventName}:`, error);
    }
  }
}

export default new AnalyticsService();