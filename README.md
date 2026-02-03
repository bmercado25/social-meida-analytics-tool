# Social Media Analytics Tool

A full-stack application for social media analytics with Supabase backend.

## Project Structure

```
.
├── api/          # Backend API (Express + TypeScript)
├── frontend/     # Frontend (React + TypeScript + Vite)
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup

### 1. Clone and Install

```bash
npm run install:all
```

### 2. Configure Environment Variables

**Backend (`api/.env`):**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Servers

```bash
npm run dev
```

This will start:
- API server on `http://localhost:3001`
- Frontend dev server on `http://localhost:5173`

## Development

### Backend API

```bash
cd api
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Supabase Client
- Zod (environment validation)
- CORS enabled

### Frontend
- React 18
- TypeScript
- Vite
- Axios (API client)
- Supabase Client

## API Endpoints

### Analytics
- `GET /api/analytics` - Get all analytics
- `GET /api/analytics/:id` - Get analytics by ID
- `POST /api/analytics` - Create new analytics entry
- `PUT /api/analytics/:id` - Update analytics entry
- `DELETE /api/analytics/:id` - Delete analytics entry

### Health
- `GET /health` - Health check endpoint

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Create an `analytics` table in your Supabase database:
   ```sql
   CREATE TABLE analytics (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     -- Add your columns here
   );
   ```
3. Get your project URL and API keys from Settings > API
4. Add them to your `.env` files

## Project Structure Details

### Backend (`api/`)
```
api/
├── src/
│   ├── config/
│   │   ├── database.ts    # Supabase client setup
│   │   └── env.ts         # Environment validation
│   ├── middleware/
│   │   └── error.middleware.ts  # Error handling
│   ├── routes/
│   │   └── analytics.routes.ts  # API routes
│   └── index.ts           # Express server
├── package.json
└── tsconfig.json
```

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── config/
│   │   ├── api.ts         # Axios client
│   │   └── supabase.ts    # Supabase client
│   ├── App.tsx            # Main component
│   ├── main.tsx           # Entry point
│   └── index.css          # Styles
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```
