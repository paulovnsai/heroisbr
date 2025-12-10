# Hero Registry System

A modern, full-featured hero registration and management system built with React, TypeScript, and Supabase.

## Features

- **Hero Registration**: Register new heroes with detailed information including:
  - Real name and hero alias
  - Multiple superpowers
  - Power level (1-100)
  - Origin story
  - Status (Active, Retired, Deceased, Missing)
  - Team affiliation
  - Profile image

- **Hero Management**:
  - View all registered heroes in a beautiful card-based grid
  - Filter heroes by status
  - Search heroes by name, alias, or team
  - View detailed hero profiles
  - Edit hero information
  - Remove heroes from registry

- **Real-time Database**: Powered by Supabase with Row Level Security
- **Beautiful UI**: Modern, responsive design with Tailwind CSS
- **Type-Safe**: Full TypeScript support

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

### Heroes Table
- Personal information (name, alias)
- Powers array
- Power level
- Origin story
- Status tracking
- Team affiliation
- Profile image URL
- Timestamps

### Hero Missions Table (Future feature)
- Mission tracking
- Success ratings
- Mission history

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Sample Heroes

The system comes pre-populated with sample heroes including:
- Spider-Man
- Wonder Woman
- Batman
- Superman
- Iron Man

## Security

All database operations are protected with Row Level Security (RLS) policies. The demo allows public access for testing purposes, but can be easily configured for authenticated users only.

## License

MIT
