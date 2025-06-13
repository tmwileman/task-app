# Task App

A modern, fast, and simple task management web application built with Next.js.

## Features

- Task creation and management
- Task lists and organization
- Subtasks and task hierarchy
- Due dates and reminders
- Calendar view
- Priority levels
- Tags and labels

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Language**: TypeScript

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your database and environment variables:
```bash
cp .env.example .env.local
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## Project Structure

```
src/
├── app/           # Next.js app router pages
├── components/    # Reusable React components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries and configurations
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```