# LinguaSync - Video & Audio Translation App

A full-stack application for transcribing and translating video/audio files with AI-powered dual subtitles.

## Features

- 🎬 Upload MP3/MP4/WAV/WebM files (up to 500MB)
- 🎤 AI transcription using OpenAI Whisper
- 🌍 Translation to multiple languages using GPT-4
- 📺 Dual subtitle player with sync highlighting
- 🔐 Secure authentication with magic link
- ☁️ Cloud storage with Supabase

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI (Whisper, GPT-4)
- **Auth**: Supabase Auth (Magic Link)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### 1. Clone and Install

```bash
cd linguasync
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and run `supabase/schema.sql`

3. Create storage buckets:
   - Go to Storage in Supabase Dashboard
   - Create bucket named `media` (private)
   - Create bucket named `subtitles` (private)

4. Run storage policies:
   - Go to SQL Editor
   - Copy and run `supabase/storage-policies.sql`

5. Configure Auth:
   - Go to Authentication > URL Configuration
   - Add your site URL (e.g., `http://localhost:3000`)
   - Add redirect URLs: `http://localhost:3000/auth/callback`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── transcribe/route.ts   # Whisper transcription
│   │   │   └── translate/route.ts    # GPT-4 translation
│   │   ├── player/
│   │   │   └── urls/route.ts         # Signed URLs for player
│   │   └── upload/
│   │       ├── confirm/route.ts      # Confirm upload
│   │       └── signed-url/route.ts   # Get signed upload URL
│   ├── auth/callback/route.ts        # Auth callback
│   ├── dashboard/page.tsx            # Dashboard
│   ├── login/page.tsx                # Login page
│   ├── projects/
│   │   ├── [id]/                     # Project detail
│   │   └── new/page.tsx              # Create project
│   └── page.tsx                      # Landing page
├── components/
│   ├── layout/                       # Layout components
│   ├── player/                       # Video player
│   ├── projects/                     # Project components
│   ├── ui/                           # shadcn/ui components
│   └── upload/                       # Upload dropzone
├── lib/
│   ├── ai/openai.ts                  # OpenAI client
│   ├── db/types.ts                   # TypeScript types
│   ├── supabase/                     # Supabase clients
│   └── vtt/                          # VTT parsing/formatting
└── middleware.ts                     # Auth middleware
```

## Database Schema

- `profiles` - User profiles (extends auth.users)
- `projects` - Translation projects
- `media_files` - Uploaded audio/video files
- `subtitle_tracks` - VTT subtitle tracks (original & translated)
- `processing_jobs` - Job queue for transcription/translation

## Usage

1. **Create Account**: Sign up with email (magic link)
2. **Create Project**: Set title and target language
3. **Upload Media**: Drag & drop your video/audio file
4. **Transcribe**: Click "Start Transcription" to generate subtitles
5. **Translate**: Click "Start Translation" to translate to target language
6. **Watch**: Play with dual subtitles (original + translated)

## Supported Languages

- Auto-detect (source)
- English, Vietnamese, Japanese, Korean, Chinese
- French, German, Spanish, Portuguese, Russian
- Arabic, Hindi, Thai, Indonesian

## Limitations

- Max file size: 500MB
- Transcription accuracy depends on audio quality
- Translation uses GPT-4 (may have rate limits)

## License

MIT
