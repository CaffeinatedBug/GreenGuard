# GreenGuard AI

**The Agentic Trust Layer for Scope 3 Carbon Auditing**

GreenGuard AI is a multi-agent platform that automates the verification of Scope 3 (supplier) carbon emissions. Instead of relying on self-reported data, GreenGuard uses a Swarm of Verifier Agents to cross-reference real-time IoT logs against external "truth" sources.

## 🚀 Features

- **Glass Box Agent Terminal**: Real-time visualization of AI agent thought processes
- **Multi-Agent Verification**: Autonomous swarm of specialized agents (BillReader, Context, Auditor)
- **Human-in-the-Loop**: Action Center for reviewing and approving flagged anomalies
- **IoT Integration**: Real-time energy monitoring from ESP32 or simulated devices
- **Automated Auditing**: Cross-reference IoT data against electricity bills and environmental context

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: ShadCN UI, Lucide React
- **Database**: Supabase (PostgreSQL)
- **LLM**: Gemini API
- **Backend**: Next.js API Routes (with optional Python FastAPI for agents)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd GreenGuard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `GEMINI_API_KEY`: Your Gemini API key

4. **Set up the database**:
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and execute the SQL statements from `DATABASE_SCHEMA.md`

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🗂️ Project Structure

```
GreenGuard/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── api/               # API routes (IoT ingestion, etc.)
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   └── dashboard/        # Dashboard-specific components
├── lib/                   # Utility functions
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
├── DATABASE_SCHEMA.md     # Database schema documentation
└── README.md             # This file
```

## 📊 Database Schema

The application uses four main tables:

1. **suppliers**: Supplier company information
2. **iot_logs**: Raw IoT sensor data
3. **audit_events**: Agent verification results and human approvals
4. **electricity_bills**: Uploaded bill information

See `DATABASE_SCHEMA.md` for detailed schema and SQL statements.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding UI Components

This project uses ShadCN UI. To add components:

```bash
npx shadcn@latest add <component-name>
```

## 🎯 MVP Features (Hackathon)

### Phase 1: The Skeleton (Hours 0-12)
- [x] Set up Next.js with TypeScript
- [x] Configure Supabase tables
- [ ] Create Glass Box Terminal Component

### Phase 2: The Agents (Hours 12-30)
- [ ] Build Ingestion API
- [ ] Implement BillReaderAgent
- [ ] Implement AuditorAgent
- [ ] Connect agents to Glass Box

### Phase 3: Action Center & Polish (Hours 30-48)
- [ ] Build Human Approval UI
- [ ] Wire approval buttons to database
- [ ] Create demo mock sequences

## 🧪 Demo Flow

1. Dashboard opens with idle Agent Terminal
2. Upload January 2026 electricity bill PDF
3. Trigger IoT event (physical device or script)
4. Watch agents stream reasoning in terminal
5. Review flagged anomaly in Action Center
6. Approve or reject the finding

## 📝 License

ISC

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

---

Built with ❤️ for a sustainable future
