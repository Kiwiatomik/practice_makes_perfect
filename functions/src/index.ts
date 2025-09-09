import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import { deepseekMessages, deepseekMessagePracticeAgain, deepseekMessageNextLevel } from './config/deepseekMessages';

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
});

// Define the secret for DeepSeek API key
const deepseekApiKey = defineSecret('DEEPSEEK_API_KEY');

// Initialize OpenAI client (will be created per function call)
const createDeepSeekClient = (apiKey: string) => {
  return new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
  });
};

// Validate user authentication
const validateAuth = (context: any) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to use AI features');
  }
  return context.auth.uid;
};

// Rate limit
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per user

const checkRateLimit = (userId: string) => {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit window
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.');
  }
  
  userLimit.count++;
  return true;
};

// Validate prompt input
const validatePromptInput = (promptText: string) => {
  if (!promptText || typeof promptText !== 'string') {
    throw new HttpsError('invalid-argument', 'promptText is required and must be a string');
  }
  
  if (promptText.length > 2000) {
    throw new HttpsError('invalid-argument', 'promptText must be less than 2000 characters');
  }
  
  if (promptText.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'promptText cannot be empty');
  }
};

// Parse AI response safely
const parseAiResponse = (content: string): any => {
  console.log('=== PARSING DEBUG START ===');
  console.log('Raw content length:', content.length);
  console.log('Raw content first 50 chars:', JSON.stringify(content.substring(0, 50)));
  console.log('Contains backticks:', content.includes('```'));
  console.log('First brace position:', content.indexOf('{'));
  console.log('Last brace position:', content.lastIndexOf('}'));
  
  try {
    let jsonContent = content;
    
    // Step 1: Handle potential double wrapping - if wrapped in {"content": "..."}
    try {
      const outerParsed = JSON.parse(content);
      if (outerParsed.content && typeof outerParsed.content === 'string') {
        jsonContent = outerParsed.content;
        console.log('STEP 1: Extracted from wrapper');
      }
    } catch {
      console.log('STEP 1: No wrapper detected');
    }
    
    // Step 2: Extract from markdown code blocks if present
    if (jsonContent.includes('```')) {
      console.log('STEP 2: Found backticks, extracting JSON between braces');
      
      const firstBrace = jsonContent.indexOf('{');
      const lastBrace = jsonContent.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
        console.log('STEP 2: Extracted content:', jsonContent.substring(0, 100));
      } else {
        console.log('STEP 2: Could not find valid braces');
      }
    } else {
      console.log('STEP 2: No markdown blocks detected');
    }
    
    // Step 3: Clean up and parse the JSON
    jsonContent = jsonContent.trim();
    
    // Replace \( and \) with backticks in the JSON to fix LaTeX parsing issues
    const beforeLatexCleanup = jsonContent.substring(0, 200);
    // jsonContent = jsonContent.replace(/\\\\?\(/g, '\`').replace(/\\\\?\)/g, '\`');
    jsonContent = jsonContent.replace('{"content":"```json\n{', '').replace('\n}\n```', '');
    if (beforeLatexCleanup !== jsonContent.substring(0, 200)) {
      console.log('Step 3 - LaTeX cleanup applied');
    }
    
    console.log('STEP 3: Final JSON length:', jsonContent.length);
    console.log('STEP 3: Final JSON first 100 chars:', JSON.stringify(jsonContent.substring(0, 100)));
    console.log('STEP 3: Attempting JSON.parse...');
    
    const result = JSON.parse(jsonContent);
    console.log('STEP 3: SUCCESS! Parsed JSON with keys:', Object.keys(result));
    console.log('=== PARSING DEBUG END ===');
    return result;
  } catch (error) {
    console.error('=== PARSING FAILED ===');
    console.error('Error:', error);
    console.error('Final content that failed:', JSON.stringify(jsonContent.substring(0, 200)));
    console.error('=== PARSING DEBUG END ===');
    // Return raw content if parsing fails
    return { content };
  }
};

/**
 * Solve a question using AI
 */
export const solveQuestion = onCall(
  {
    secrets: [deepseekApiKey],
    maxInstances: 5,
    timeoutSeconds: 30,
  },
  async (request) => {
    try {
      // Validate authentication
      const userId = validateAuth(request);
      
      // Check rate limit
      checkRateLimit(userId);
      
      // Validate input
      const { promptText } = request.data;
      validatePromptInput(promptText);
      
      // Optional: Add course/lesson access validation here
      // const { courseId, lessonId } = request.data;
      // await validateUserAccess(userId, courseId, lessonId);
      
      console.log(`AI solve request from user ${userId} for prompt: ${promptText.substring(0, 100)}...`);
      
      // Create DeepSeek client
      const client = createDeepSeekClient(deepseekApiKey.value());
      
      // Call DeepSeek API
      const completion = await client.chat.completions.create({
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
        temperature: 0,
        max_tokens: 1000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new HttpsError('internal', 'No solution received from AI service');
      }

      // Parse and return the response
      const parsedResponse = parseAiResponse(aiResponse);
      
      console.log(`AI solve completed for user ${userId}`);
      
      return {
        success: true,
        solution: parsedResponse,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Error in solveQuestion:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to process AI request');
    }
  }
);

/**
 * Generate a practice question using AI
 */
export const generatePracticeQuestion = onCall(
  {
    secrets: [deepseekApiKey],
    maxInstances: 5,
    timeoutSeconds: 30,
  },
  async (request) => {
    try {
      const userId = validateAuth(request);
      checkRateLimit(userId);
      
      const { promptText } = request.data;
      validatePromptInput(promptText);
      
      console.log(`AI practice question request from user ${userId}`);
      
      const client = createDeepSeekClient(deepseekApiKey.value());
      
      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: deepseekMessagePracticeAgain.systemMessage
          },
          {
            role: 'user',
            content: deepseekMessagePracticeAgain.userMessageTemplate.replace('{promptText}', promptText)
          }
        ],
        stream: false,
        temperature: 0.8,
        max_tokens: 1200,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new HttpsError('internal', 'No practice question received from AI service');
      }

      const parsedResponse = parseAiResponse(aiResponse);
      
      console.log(`AI practice question completed for user ${userId}`);
      
      return {
        success: true,
        practiceQuestion: parsedResponse,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Error in generatePracticeQuestion:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to generate practice question');
    }
  }
);

/**
 * Generate a next level question using AI
 */
export const generateNextLevelQuestion = onCall(
  {
    secrets: [deepseekApiKey],
    maxInstances: 5,
    timeoutSeconds: 30,
  },
  async (request) => {
    try {
      const userId = validateAuth(request);
      checkRateLimit(userId);
      
      const { promptText } = request.data;
      validatePromptInput(promptText);
      
      console.log(`AI next level question request from user ${userId}`);
      
      const client = createDeepSeekClient(deepseekApiKey.value());
      
      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: deepseekMessageNextLevel.systemMessage
          },
          {
            role: 'user',
            content: deepseekMessageNextLevel.userMessageTemplate.replace('{promptText}', promptText)
          }
        ],
        stream: false,
        temperature: 0.8,
        max_tokens: 1200,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new HttpsError('internal', 'No next level question received from AI service');
      }

      const parsedResponse = parseAiResponse(aiResponse);
      
      console.log(`AI next level question completed for user ${userId}`);
      
      return {
        success: true,
        nextLevelQuestion: parsedResponse,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Error in generateNextLevelQuestion:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to generate next level question');
    }
  }
);
