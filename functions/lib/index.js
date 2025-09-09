"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNextLevelQuestion = exports.generatePracticeQuestion = exports.solveQuestion = void 0;
const https_1 = require("firebase-functions/v2/https");
const options_1 = require("firebase-functions/v2/options");
const params_1 = require("firebase-functions/params");
const openai_1 = require("openai");
const deepseekMessages_1 = require("./config/deepseekMessages");
// Set global options for all functions
(0, options_1.setGlobalOptions)({
    maxInstances: 10,
    region: 'us-central1',
});
// Define the secret for DeepSeek API key
const deepseekApiKey = (0, params_1.defineSecret)('DEEPSEEK_API_KEY');
// Initialize OpenAI client (will be created per function call)
const createDeepSeekClient = (apiKey) => {
    return new openai_1.default({
        baseURL: 'https://api.deepseek.com',
        apiKey: apiKey,
    });
};
// Validate user authentication
const validateAuth = (context) => {
    if (!context.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated to use AI features');
    }
    return context.auth.uid;
};
// Rate limiting helper (simple in-memory store for demo - use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per user
const checkRateLimit = (userId) => {
    const now = Date.now();
    const userLimit = rateLimitStore.get(userId);
    if (!userLimit || now > userLimit.resetTime) {
        // Reset or create new limit window
        rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
        throw new https_1.HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.');
    }
    userLimit.count++;
    return true;
};
// Validate prompt input
const validatePromptInput = (promptText) => {
    if (!promptText || typeof promptText !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'promptText is required and must be a string');
    }
    if (promptText.length > 2000) {
        throw new https_1.HttpsError('invalid-argument', 'promptText must be less than 2000 characters');
    }
    if (promptText.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'promptText cannot be empty');
    }
};
// Parse AI response safely
const parseAiResponse = (content) => {
    try {
        let jsonContent = content;
        console.log('Step 0 - Original content:', content.substring(0, 200) + '...');
        // Step 1: Handle potential double wrapping - if wrapped in {"content": "..."}
        try {
            const outerParsed = JSON.parse(content);
            if (outerParsed.content && typeof outerParsed.content === 'string') {
                jsonContent = outerParsed.content;
                console.log('Step 1 - Extracted from wrapper:', jsonContent.substring(0, 200) + '...');
            }
        }
        catch (_a) {
            // Not wrapped, continue with original content
            console.log('Step 1 - No wrapper detected');
        }
        // Step 2: Extract from markdown code blocks if present
        const markdownMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
            jsonContent = markdownMatch[1].trim();
            console.log('Step 2 - Extracted from markdown:', jsonContent.substring(0, 200) + '...');
        }
        else {
            console.log('Step 2 - No markdown blocks detected');
        }
        // Step 3: Clean up and parse the JSON
        jsonContent = jsonContent.trim();
        // Replace \( and \) with backticks in the JSON to fix LaTeX parsing issues
        const beforeLatexCleanup = jsonContent.substring(0, 200);
        jsonContent = jsonContent.replace(/\\\\?\(/g, '`').replace(/\\\\?\)/g, '`');
        if (beforeLatexCleanup !== jsonContent.substring(0, 200)) {
            console.log('Step 3 - LaTeX cleanup applied');
        }
        console.log('Step 4 - Final JSON to parse:', jsonContent.substring(0, 200) + '...');
        const result = JSON.parse(jsonContent);
        console.log('Step 5 - Successfully parsed JSON with keys:', Object.keys(result));
        return result;
    }
    catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        console.error('Raw content that failed to parse:', content.substring(0, 500) + '...');
        // Return raw content if parsing fails
        return { content };
    }
};
/**
 * Solve a question using AI
 */
exports.solveQuestion = (0, https_1.onCall)({
    secrets: [deepseekApiKey],
    maxInstances: 5,
    timeoutSeconds: 30,
}, async (request) => {
    var _a, _b;
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
                    content: deepseekMessages_1.deepseekMessages.systemMessage
                },
                {
                    role: 'user',
                    content: deepseekMessages_1.deepseekMessages.userMessageTemplate.replace('{promptText}', promptText)
                }
            ],
            stream: false,
            temperature: 0,
            max_tokens: 1000,
        });
        const aiResponse = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!aiResponse) {
            throw new https_1.HttpsError('internal', 'No solution received from AI service');
        }
        // Parse and return the response
        const parsedResponse = parseAiResponse(aiResponse);
        console.log(`AI solve completed for user ${userId}`);
        return {
            success: true,
            solution: parsedResponse,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error in solveQuestion:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to process AI request');
    }
});
/**
 * Generate a practice question using AI
 */
exports.generatePracticeQuestion = (0, https_1.onCall)({
    secrets: [deepseekApiKey],
    maxInstances: 5,
    timeoutSeconds: 30,
}, async (request) => {
    var _a, _b;
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
                    content: deepseekMessages_1.deepseekMessagePracticeAgain.systemMessage
                },
                {
                    role: 'user',
                    content: deepseekMessages_1.deepseekMessagePracticeAgain.userMessageTemplate.replace('{promptText}', promptText)
                }
            ],
            stream: false,
            temperature: 0.8,
            max_tokens: 1200,
        });
        const aiResponse = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!aiResponse) {
            throw new https_1.HttpsError('internal', 'No practice question received from AI service');
        }
        const parsedResponse = parseAiResponse(aiResponse);
        console.log(`AI practice question completed for user ${userId}`);
        return {
            success: true,
            practiceQuestion: parsedResponse,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error in generatePracticeQuestion:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to generate practice question');
    }
});
/**
 * Generate a next level question using AI
 */
exports.generateNextLevelQuestion = (0, https_1.onCall)({
    secrets: [deepseekApiKey],
    maxInstances: 5,
    timeoutSeconds: 30,
}, async (request) => {
    var _a, _b;
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
                    content: deepseekMessages_1.deepseekMessageNextLevel.systemMessage
                },
                {
                    role: 'user',
                    content: deepseekMessages_1.deepseekMessageNextLevel.userMessageTemplate.replace('{promptText}', promptText)
                }
            ],
            stream: false,
            temperature: 0.8,
            max_tokens: 1200,
        });
        const aiResponse = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!aiResponse) {
            throw new https_1.HttpsError('internal', 'No next level question received from AI service');
        }
        const parsedResponse = parseAiResponse(aiResponse);
        console.log(`AI next level question completed for user ${userId}`);
        return {
            success: true,
            nextLevelQuestion: parsedResponse,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error in generateNextLevelQuestion:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to generate next level question');
    }
});
//# sourceMappingURL=index.js.map