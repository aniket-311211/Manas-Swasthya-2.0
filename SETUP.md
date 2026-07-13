# Nexus Mind Care - Assessment Feature Setup

## Overview
This project now includes a comprehensive mental health assessment feature powered by Google Gemini AI and Prisma database integration.

## Features Added

### 1. Backend API Server (`server.js`)
- Express.js server with Prisma integration
- `/api/analyze` endpoint for assessment analysis
- Database storage for assessments and user data
- Gemini AI integration for personalized recommendations

### 2. Assessment Component (`src/components/Assessment.tsx`)
- Interactive 5-question assessment flow
- Real-time progress tracking
- AI-powered analysis with Gemini
- Results display with scores and recommendations
- Responsive design with shadcn/ui components

### 3. Database Schema (`prisma/schema.prisma`)
- User management with Clerk integration
- Assessment storage with scores and recommendations
- Activity and game tracking
- Chat message history
- Mood tracking

### 4. Updated Dashboard (`src/components/UserDashboard.tsx`)
- "Take Assessment" button in the Assessment Snapshot section
- Modal integration for assessment flow
- Seamless user experience

## Environment Variables Required

Add these to your `.env` file:

```env
# Frontend
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GEMINI_FALLBACK_API_KEY=your_fallback_gemini_key

# Backend
GEMINI_API_KEY=your_gemini_key
PORT=3001

# Database (Prisma Accelerate)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_prisma_accelerate_api_key"
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start separately:
   npm run dev        # Frontend (port 5173)
   npm run server     # Backend (port 3001)
   ```

## API Endpoints

- `GET /health` - Health check
- `POST /api/analyze` - Analyze assessment answers
- `GET /api/assessments/:userId` - Get user's assessment history
- `POST /api/users` - Create/update user
- `GET /api/activities/:userId` - Get user activities
- `PATCH /api/activities/:activityId` - Update activity completion

## Assessment Flow

1. User clicks "Take Assessment" button
2. 5-question multiple choice assessment
3. Answers sent to `/api/analyze` endpoint
4. Gemini AI analyzes responses
5. Results displayed with:
   - Stress, Anxiety, Sleep scores (0-100)
   - 3 recommended activities
   - 3 recommended mindfulness games
6. Data stored in database for future reference

## Database Models

- **User**: Clerk integration, profile data
- **Assessment**: Scores, answers, AI recommendations
- **UserActivity**: Activity tracking and completion
- **ChatMessage**: AI conversation history
- **MindfulnessGame**: Game recommendations and completion
- **MoodEntry**: Daily mood tracking

## Sample Gemini Prompt

The backend uses this structured prompt to ensure consistent JSON responses:

```
You are a mental health assessment AI. Analyze the provided answers and return ONLY a valid JSON object with the following structure:

{
  "stress": <number between 0-100>,
  "anxiety": <number between 0-100>, 
  "sleep": <number between 0-100>,
  "activities": [
    {"name": "<activity name>", "duration": "<duration>"},
    {"name": "<activity name>", "duration": "<duration>"},
    {"name": "<activity name>", "duration": "<duration>"}
  ],
  "games": [
    {"name": "<game name>", "duration": "<duration>"},
    {"name": "<game name>", "duration": "<duration>"},
    {"name": "<game name>", "duration": "<duration>"}
  ]
}
```

## Production Deployment

1. Set up Prisma Accelerate for database connection
2. Configure environment variables in production
3. Deploy backend to your preferred hosting service
4. Update frontend API endpoints to point to production backend
5. Run database migrations: `npx prisma db push`

## Troubleshooting

- **Database Connection Issues**: Verify DATABASE_URL format and Prisma Accelerate API key
- **Gemini API Errors**: Check API key validity and quota limits
- **CORS Issues**: Ensure backend CORS is configured for your frontend domain
- **Assessment Not Loading**: Check browser console for API endpoint errors

