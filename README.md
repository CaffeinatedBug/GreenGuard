# GreenGuard AI

An AI-powered IoT energy monitoring and auditing platform that helps businesses track energy consumption, detect anomalies, and ensure compliance with sustainability standards.

## Features

- **Real-time Energy Monitoring**: Live dashboard displaying IoT sensor data from multiple suppliers
- **AI-Powered Auditing**: Intelligent agents that verify energy consumption patterns against electricity bill limits
- **Anomaly Detection**: Automatic flagging of unusual energy consumption patterns
- **Glass Box AI**: Transparent reasoning displayed in real-time terminal
- **Human-in-the-Loop**: Manual verification system for audit approvals
- **Carbon Footprint Tracking**: Monitors grid carbon intensity for sustainability metrics

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Radix UI, Lucide Icons, Recharts
- **AI Agent**: Google Gemini API

## Project Structure

```
greenguard-ai/
├── src/
│   ├── app/              # Next.js app router pages
│   │   └── api/          # API routes for backend logic
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   └── dashboard/    # Dashboard-specific components
│   ├── lib/              # Utility functions and Supabase client
│   └── types/            # TypeScript type definitions
├── scripts/              # Utility scripts for development
└── public/               # Static assets
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set Up Supabase Database

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration file located at `supabase/migrations/001_initial_schema.sql`
4. This will create the necessary tables and seed data

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 5. Seed Mock Data (Optional)

To populate the database with test IoT data:

```bash
npx tsx scripts/seed-demo-data.ts
```

## Database Schema

### Tables

- **suppliers**: Stores supplier information including bill limits and grid carbon intensity
- **iot_logs**: Records real-time IoT sensor readings (energy, voltage, current, power)
- **audit_events**: Tracks AI audit results and human verification actions

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding Mock Data

Use the MockIotGenerator class to create realistic test data:

```typescript
import { MockIotGenerator } from '@/lib/mock-data-generator';

const generator = new MockIotGenerator();
const readings = generator.generateSequence(supplierId, 10, 'NORMAL');
```

## License

MIT
