# Practice Makes Perfect

[insert url] is learning platform, specialised in applied mathematics, that creates adaptive content which grows with the user, built with React and Firebase. 
The **"Next Level" System** provides a progressive learning experience.

## Features

- **Adaptive Learning**: AI-generated questions that build on user progress
- **Interactive Math Support**: LaTeX rendering with helper buttons for mathematical notation
- **Real-time Feedback**: Immediate solutions and explanations after answer submission
- **Progress Tracking**: User performance monitoring across courses and lessons
- **Secure Authentication**: Firebase-based user authentication with Google OAuth

## Local hosting 

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- DeepSeek API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd practice_makes_perfect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Firebase configuration and DeepSeek API key in `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
```

4. Start the development server:
```bash
npm run dev
```

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **React Router** for navigation
- **Vite** for fast development and building
- **Bootstrap 5** with custom SCSS theming
- **KaTeX** for mathematical equation rendering

### Backend Services
- **Firebase Firestore** for data storage
- **Firebase Authentication** for user management
- **DeepSeek API** for AI-generated content

## Admin Features

Access the admin interface at `/admin/questions` to:
- Populate courses with sample questions
- Manage lesson content
- Bulk import mathematical and programming exercises

