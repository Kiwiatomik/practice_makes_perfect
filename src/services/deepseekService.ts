import OpenAI from 'openai';
import { deepseekMessages } from '../config/deepseekMessages';

class DeepseekService {
  private client: OpenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      throw new Error('VITE_DEEPSEEK_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, 
    });
  }

  async solveQuestionWithAI(promptText: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: deepseekMessages.systemMessage
          },
          {
            role: 'user',
            content: deepseekMessages.userMessageTemplate.replace('{promptText}', promptText)
          }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 500
      });

      const interpretedContent = completion.choices[0]?.message?.content;
      
      if (!interpretedContent) {
        throw new Error('No solution received from Deepseek');
      }

      return interpretedContent;
    } catch (error) {
      console.error('Error solving question with Deepseek:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to solve question: ${error.message}`);
      }
      
      throw new Error('Failed to solve question: Unknown error');
    }
  }
}

export const deepseekService = new DeepseekService();
