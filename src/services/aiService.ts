import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { auth } from '../config/firebase';

interface AiSolutionResponse {
  success: boolean;
  solution: {
    subject: string;
    level: string;
    answer: string;
    workings: Array<{
      format: 'title' | 'paragraph';
      content: string;
    }>;
  };
  timestamp: string;
}

interface AiPracticeQuestionResponse {
  success: boolean;
  practiceQuestion: {
    subject: string;
    level: string;
    new_question: string;
    answer: string;
    workings: Array<{
      format: 'title' | 'paragraph';
      content: string;
    }>;
  };
  timestamp: string;
}

interface AiNextLevelQuestionResponse {
  success: boolean;
  nextLevelQuestion: {
    subject: string;
    level: string;
    next_level_question: string;
    answer: string;
    workings: Array<{
      format: 'title' | 'paragraph';
      content: string;
    }>;
  };
  timestamp: string;
}

class AiService {
  private solveQuestionFunction;
  private generatePracticeQuestionFunction;
  private generateNextLevelQuestionFunction;

  constructor() {
    // Initialize Firebase Functions
    this.solveQuestionFunction = httpsCallable(functions, 'solveQuestion');
    this.generatePracticeQuestionFunction = httpsCallable(functions, 'generatePracticeQuestion');
    this.generateNextLevelQuestionFunction = httpsCallable(functions, 'generateNextLevelQuestion');
  }

  /**
   * Ensure user is authenticated before making AI requests
   */
  private async ensureAuthenticated(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be logged in to use AI features');
    }
  }

  /**
   * Solve a question using AI
   */
  async solveQuestionWithAI(
    promptText: string, 
    courseId?: string, 
    lessonId?: string
  ): Promise<string> {
    try {
      await this.ensureAuthenticated();

      const result = await this.solveQuestionFunction({
        promptText,
        courseId,
        lessonId
      });

      const data = result.data as AiSolutionResponse;
      
      if (!data.success || !data.solution) {
        throw new Error('Failed to get AI solution');
      }

      // Return the parsed solution as JSON string (to maintain compatibility)
      return JSON.stringify(data.solution);
      
    } catch (error: any) {
      console.error('Error solving question with AI:', error);
      
      if (error?.code === 'functions/unauthenticated') {
        throw new Error('Please log in to use AI features');
      } else if (error?.code === 'functions/resource-exhausted') {
        throw new Error('Rate limit exceeded. Please try again in a minute.');
      } else if (error?.code === 'functions/invalid-argument') {
        throw new Error('Invalid question format');
      }
      
      throw new Error('Failed to solve question with AI');
    }
  }

  /**
   * Generate a practice question using AI
   */
  async generatePracticeQuestion(originalPromptText: string): Promise<string> {
    try {
      await this.ensureAuthenticated();

      const result = await this.generatePracticeQuestionFunction({
        promptText: originalPromptText
      });

      const data = result.data as AiPracticeQuestionResponse;
      
      if (!data.success || !data.practiceQuestion) {
        throw new Error('Failed to generate practice question');
      }

      // Return the parsed practice question as JSON string (to maintain compatibility)
      return JSON.stringify(data.practiceQuestion);
      
    } catch (error: any) {
      console.error('Error generating practice question:', error);
      
      if (error?.code === 'functions/unauthenticated') {
        throw new Error('Please log in to use AI features');
      } else if (error?.code === 'functions/resource-exhausted') {
        throw new Error('Rate limit exceeded. Please try again in a minute.');
      }
      
      throw new Error('Failed to generate practice question');
    }
  }

  /**
   * Generate a next level question using AI
   */
  async generateNextLevelQuestion(originalPromptText: string): Promise<string> {
    try {
      await this.ensureAuthenticated();

      const result = await this.generateNextLevelQuestionFunction({
        promptText: originalPromptText
      });

      const data = result.data as AiNextLevelQuestionResponse;
      
      if (!data.success || !data.nextLevelQuestion) {
        throw new Error('Failed to generate next level question');
      }

      // Return the parsed next level question as JSON string (to maintain compatibility)  
      return JSON.stringify(data.nextLevelQuestion);
      
    } catch (error: any) {
      console.error('Error generating next level question:', error);
      
      if (error?.code === 'functions/unauthenticated') {
        throw new Error('Please log in to use AI features');
      } else if (error?.code === 'functions/resource-exhausted') {
        throw new Error('Rate limit exceeded. Please try again in a minute.');
      }
      
      throw new Error('Failed to generate next level question');
    }
  }
}

// Export singleton instance
export const aiService = new AiService();