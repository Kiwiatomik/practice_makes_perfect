import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { coursesService } from '../services/coursesService';
import { Prompt, Working } from '../types';

// Firebase config - you'll need to set these environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mathematics questions with LaTeX formatting
const mathematicsQuestions: {
  courseId: string;
  lessonId: string;
  prompts: Omit<Prompt, 'id' | 'createdAt'>[];
}[] = [
  {
    courseId: "calculus_course_id", // You'll need to replace with actual course ID
    lessonId: "differentiation_lesson_id", // You'll need to replace with actual lesson ID
    prompts: [
      {
        text: "Find the derivative of \\( f(x) = 2x^3 + 5x^2 - 3x + 1 \\)",
        abstractionLevel: 0,
        difficulty: "Easy",
        level: "Bachelor",
        answer: "\\( f'(x) = 6x^2 + 10x - 3 \\)",
        workings: [
          {
            format: "title",
            content: "Solution: Finding the derivative using the power rule"
          },
          {
            format: "paragraph",
            content: "We'll use the power rule: \\( \\frac{d}{dx}[x^n] = nx^{n-1} \\)"
          },
          {
            format: "paragraph",
            content: "For \\( f(x) = 2x^3 + 5x^2 - 3x + 1 \\):"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[2x^3] = 2 \\cdot 3x^{3-1} = 6x^2 \\)"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[5x^2] = 5 \\cdot 2x^{2-1} = 10x \\)"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[-3x] = -3 \\cdot 1x^{1-1} = -3 \\)"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[1] = 0 \\) (derivative of constant is zero)"
          },
          {
            format: "paragraph",
            content: "Therefore: \\( f'(x) = 6x^2 + 10x - 3 \\)"
          }
        ]
      },
      {
        text: "Find the derivative of \\( g(x) = x^4 - 2x^3 + 7x - 5 \\)",
        abstractionLevel: 0,
        difficulty: "Easy",
        level: "Bachelor",
        answer: "\\( g'(x) = 4x^3 - 6x^2 + 7 \\)",
        workings: [
          {
            format: "title",
            content: "Solution: Finding the derivative using the power rule"
          },
          {
            format: "paragraph",
            content: "Using the power rule \\( \\frac{d}{dx}[x^n] = nx^{n-1} \\) for each term:"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[x^4] = 4x^3 \\)"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[-2x^3] = -2 \\cdot 3x^2 = -6x^2 \\)"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[7x] = 7 \\)"
          },
          {
            format: "paragraph",
            content: "\\( \\frac{d}{dx}[-5] = 0 \\)"
          },
          {
            format: "paragraph",
            content: "Therefore: \\( g'(x) = 4x^3 - 6x^2 + 7 \\)"
          }
        ]
      },
      {
        text: "Use the product rule to find the derivative of \\( h(x) = (2x + 1)(x^2 - 3) \\)",
        abstractionLevel: 0,
        difficulty: "Medium",
        level: "Bachelor",
        answer: "\\( h'(x) = 6x^2 + 2x - 6 \\)",
        workings: [
          {
            format: "title",
            content: "Solution: Using the product rule"
          },
          {
            format: "paragraph",
            content: "The product rule states: \\( (fg)' = f'g + fg' \\)"
          },
          {
            format: "paragraph",
            content: "Let \\( f(x) = 2x + 1 \\) and \\( g(x) = x^2 - 3 \\)"
          },
          {
            format: "paragraph",
            content: "Find the derivatives:"
          },
          {
            format: "paragraph",
            content: "\\( f'(x) = 2 \\)"
          },
          {
            format: "paragraph",
            content: "\\( g'(x) = 2x \\)"
          },
          {
            format: "paragraph",
            content: "Apply the product rule:"
          },
          {
            format: "paragraph",
            content: "\\( h'(x) = f'(x)g(x) + f(x)g'(x) \\)"
          },
          {
            format: "paragraph",
            content: "\\( h'(x) = 2(x^2 - 3) + (2x + 1)(2x) \\)"
          },
          {
            format: "paragraph",
            content: "\\( h'(x) = 2x^2 - 6 + 4x^2 + 2x \\)"
          },
          {
            format: "paragraph",
            content: "\\( h'(x) = 6x^2 + 2x - 6 \\)"
          }
        ]
      },
      {
        text: "Find the derivative of \\( y = \\frac{x^2 + 1}{x - 2} \\) using the quotient rule",
        abstractionLevel: 0,
        difficulty: "Hard",
        level: "Bachelor",
        answer: "\\( y' = \\frac{x^2 - 4x - 1}{(x - 2)^2} \\)",
        workings: [
          {
            format: "title",
            content: "Solution: Using the quotient rule"
          },
          {
            format: "paragraph",
            content: "The quotient rule states: \\( \\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2} \\)"
          },
          {
            format: "paragraph",
            content: "Let \\( f(x) = x^2 + 1 \\) and \\( g(x) = x - 2 \\)"
          },
          {
            format: "paragraph",
            content: "Find the derivatives:"
          },
          {
            format: "paragraph",
            content: "\\( f'(x) = 2x \\)"
          },
          {
            format: "paragraph",
            content: "\\( g'(x) = 1 \\)"
          },
          {
            format: "paragraph",
            content: "Apply the quotient rule:"
          },
          {
            format: "paragraph",
            content: "\\( y' = \\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2} \\)"
          },
          {
            format: "paragraph",
            content: "\\( y' = \\frac{2x(x - 2) - (x^2 + 1)(1)}{(x - 2)^2} \\)"
          },
          {
            format: "paragraph",
            content: "\\( y' = \\frac{2x^2 - 4x - x^2 - 1}{(x - 2)^2} \\)"
          },
          {
            format: "paragraph",
            content: "\\( y' = \\frac{x^2 - 4x - 1}{(x - 2)^2} \\)"
          }
        ]
      }
    ]
  },
  {
    courseId: "algebra_course_id", // You'll need to replace with actual course ID
    lessonId: "quadratic_equations_lesson_id", // You'll need to replace with actual lesson ID
    prompts: [
      {
        text: "Solve the quadratic equation \\( x^2 - 5x + 6 = 0 \\)",
        abstractionLevel: 0,
        difficulty: "Easy",
        level: "High school",
        answer: "\\( x = 2 \\) or \\( x = 3 \\)",
        workings: [
          {
            format: "title",
            content: "Solution: Solving by factoring"
          },
          {
            format: "paragraph",
            content: "We need to factor \\( x^2 - 5x + 6 \\)"
          },
          {
            format: "paragraph",
            content: "Look for two numbers that multiply to 6 and add to -5:"
          },
          {
            format: "paragraph",
            content: "The numbers are -2 and -3 because (-2) × (-3) = 6 and (-2) + (-3) = -5"
          },
          {
            format: "paragraph",
            content: "So: \\( x^2 - 5x + 6 = (x - 2)(x - 3) = 0 \\)"
          },
          {
            format: "paragraph",
            content: "Using the zero product property:"
          },
          {
            format: "paragraph",
            content: "\\( x - 2 = 0 \\) or \\( x - 3 = 0 \\)"
          },
          {
            format: "paragraph",
            content: "Therefore: \\( x = 2 \\) or \\( x = 3 \\)"
          }
        ]
      },
      {
        text: "Use the quadratic formula to solve \\( 2x^2 + 3x - 2 = 0 \\)",
        abstractionLevel: 0,
        difficulty: "Medium",
        level: "High school",
        answer: "\\( x = \\frac{1}{2} \\) or \\( x = -2 \\)",
        workings: [
          {
            format: "title",
            content: "Solution: Using the quadratic formula"
          },
          {
            format: "paragraph",
            content: "For \\( ax^2 + bx + c = 0 \\), the quadratic formula is:"
          },
          {
            format: "paragraph",
            content: "\\( x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\)"
          },
          {
            format: "paragraph",
            content: "Here: \\( a = 2 \\), \\( b = 3 \\), \\( c = -2 \\)"
          },
          {
            format: "paragraph",
            content: "Calculate the discriminant:"
          },
          {
            format: "paragraph",
            content: "\\( b^2 - 4ac = 3^2 - 4(2)(-2) = 9 + 16 = 25 \\)"
          },
          {
            format: "paragraph",
            content: "Apply the formula:"
          },
          {
            format: "paragraph",
            content: "\\( x = \\frac{-3 \\pm \\sqrt{25}}{2(2)} = \\frac{-3 \\pm 5}{4} \\)"
          },
          {
            format: "paragraph",
            content: "Therefore: \\( x = \\frac{-3 + 5}{4} = \\frac{2}{4} = \\frac{1}{2} \\) or \\( x = \\frac{-3 - 5}{4} = \\frac{-8}{4} = -2 \\)"
          }
        ]
      }
    ]
  }
];

// Function to populate questions
async function populateQuestions() {
  try {
    console.log('Starting to populate questions...');
    
    for (const courseData of mathematicsQuestions) {
      const { courseId, lessonId, prompts } = courseData;
      
      console.log(`Adding ${prompts.length} questions to course ${courseId}, lesson ${lessonId}`);
      
      const promptIds = await coursesService.createMultiplePrompts(courseId, lessonId, prompts);
      
      console.log(`Successfully created prompts with IDs: ${promptIds.join(', ')}`);
    }
    
    console.log('All questions populated successfully!');
  } catch (error) {
    console.error('Error populating questions:', error);
    throw error;
  }
}

// Helper function to get existing courses and lessons
async function listCoursesAndLessons() {
  try {
    const courses = await coursesService.getAllCourses();
    
    console.log('\n=== Available Courses and Lessons ===');
    for (const course of courses) {
      console.log(`\nCourse: ${course.title} (ID: ${course.id})`);
      console.log(`Subject: ${course.subject}, Level: ${course.level}`);
      
      if (course.lessons.length > 0) {
        console.log('Lessons:');
        for (const lesson of course.lessons) {
          console.log(`  - ${lesson.title} (ID: ${lesson.id})`);
        }
      } else {
        console.log('  No lessons found');
      }
    }
  } catch (error) {
    console.error('Error listing courses and lessons:', error);
    throw error;
  }
}

// Export functions for use
export { populateQuestions, listCoursesAndLessons, mathematicsQuestions };

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'list') {
    listCoursesAndLessons().catch(console.error);
  } else if (command === 'populate') {
    populateQuestions().catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  npm run populate-questions list    # List existing courses and lessons');
    console.log('  npm run populate-questions populate # Add questions to database');
  }
}