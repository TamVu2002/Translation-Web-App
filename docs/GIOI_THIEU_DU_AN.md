# 🌐 LinguaSync - Ứng Dụng Dịch Video & Audio Bằng AI

<p align="center">
  <img src="../public/logo.png" alt="LinguaSync Logo" width="120" />
</p>

<p align="center">
  <strong>Transcribe • Translate • Watch with Dual Subtitles</strong>
</p>

<p align="center">
  <a href="#tính-năng">Tính năng</a> •
  <a href="#công-nghệ">Công nghệ</a> •
  <a href="#kiến-trúc">Kiến trúc</a> •
  <a href="#cơ-sở-dữ-liệu">Database</a> •
  <a href="#api-endpoints">API</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## 📋 Tổng Quan

**LinguaSync** là một ứng dụng web full-stack cho phép người dùng:

1. **Upload** video/audio lên cloud
2. **Transcribe** (chuyển đổi giọng nói thành văn bản) bằng OpenAI Whisper
3. **Translate** (dịch phụ đề) sang ngôn ngữ khác bằng GPT-4
4. **Watch** (xem) với phụ đề kép đồng thời hiển thị bản gốc và bản dịch

### Ai nên dùng LinguaSync?

| Đối tượng | Use Case |
|-----------|----------|
| 🎓 **Học sinh/Sinh viên** | Học ngoại ngữ qua video YouTube, phim, podcast |
| 🎬 **Content Creator** | Tạo phụ đề đa ngôn ngữ cho video |
| 🏢 **Doanh nghiệp** | Dịch video training, hội nghị nội bộ |
| 🔬 **Nghiên cứu** | Phân tích nội dung audio/video đa ngôn ngữ |

---

## ✨ Tính Năng

### Core Features

| Tính năng | Mô tả | Công nghệ |
|-----------|-------|-----------|
| 🔐 **Magic Link Auth** | Đăng nhập không cần mật khẩu | Supabase Auth |
| 📤 **Large File Upload** | Upload file đến 500MB với progress | Signed URL + XHR |
| 🎤 **AI Transcription** | Chuyển đổi giọng nói → văn bản | OpenAI Whisper |
| 🌍 **Smart Translation** | Dịch giữ nguyên timestamp | GPT-4 |
| 📺 **Dual Subtitle Player** | 2 dòng phụ đề đồng thời | HTML5 Video + Custom VTT Parser |
| 🎯 **Line Highlighting** | Highlight câu đang nói | Binary Search Algorithm |

### Định dạng hỗ trợ

**Video:**
- MP4 (H.264)
- WebM (VP8/VP9)
- MOV (QuickTime)

**Audio:**
- MP3
- WAV
- M4A

**Subtitle:**
- WebVTT (.vtt)

### Ngôn ngữ hỗ trợ

```
🇻🇳 Vietnamese    🇺🇸 English      🇯🇵 Japanese
🇰🇷 Korean        🇨🇳 Chinese      🇫🇷 French
🇩🇪 German        🇪🇸 Spanish      🇵🇹 Portuguese
🇷🇺 Russian       🇸🇦 Arabic       🇮🇳 Hindi
🇹🇭 Thai          🇮🇩 Indonesian
```

---

## 🛠 Công Nghệ

### Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
├─────────────────────────────────────────────────────────┤
│  Next.js 14        │  React Framework (App Router)     │
│  TypeScript        │  Type Safety                      │
│  Tailwind CSS      │  Utility-first Styling            │
│  shadcn/ui         │  UI Components                    │
│  Lucide Icons      │  Icon Library                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
├─────────────────────────────────────────────────────────┤
│  Next.js API Routes│  Serverless Functions             │
│  Supabase          │  Database + Auth + Storage        │
│  OpenAI API        │  Whisper + GPT-4                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                       │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL        │  Relational Database (Supabase)   │
│  Supabase Storage  │  S3-compatible Object Storage     │
│  Row Level Security│  Database-level Authorization     │
└─────────────────────────────────────────────────────────┘
```

### Tại sao chọn tech stack này?

| Công nghệ | Lý do |
|-----------|-------|
| **Next.js 14** | App Router mới, Server Components, tối ưu SEO |
| **Supabase** | PostgreSQL + Auth + Storage trong 1 platform, RLS mạnh mẽ |
| **shadcn/ui** | Components đẹp, customizable, không bloat |
| **OpenAI** | Whisper chính xác nhất thị trường, GPT-4 dịch tự nhiên |

---

## 🏗 Kiến Trúc

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   Browser   │  │   Upload    │  │   DualSubPlayer     │   │
│  │   (React)   │  │   Dropzone  │  │   (VTT + Video)     │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  Middleware │  │  API Routes │  │   Server Components │   │
│  │  (Auth)     │  │  /api/*     │  │   (SSR)             │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                        SUPABASE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │    Auth     │  │  PostgreSQL │  │      Storage        │   │
│  │ (Magic Link)│  │   (+ RLS)   │  │  (media/subtitles)  │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────┐
│                        OPENAI API                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐    │
│  │   Whisper API       │  │        GPT-4 API            │    │
│  │   (Transcription)   │  │      (Translation)          │    │
│  └─────────────────────┘  └─────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Upload  │───▶│ Storage │───▶│ Whisper │───▶│  VTT    │
│  Media  │    │ (media) │    │  API    │    │ (orig)  │
└─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                  │
                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Player  │◀───│ Storage │◀───│  GPT-4  │◀───│  Parse  │
│  (Dual) │    │ (subs)  │    │  API    │    │  Cues   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

## 💾 Cơ Sở Dữ Liệu

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│    auth.users   │       │    profiles     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──────│ id (PK, FK)     │
│ email           │       │ email           │
│ ...             │       │ full_name       │
└────────┬────────┘       │ avatar_url      │
         │                └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│    projects     │       │   media_files   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──┐   │ id (PK)         │
│ owner_id (FK)   │   │   │ project_id (FK) │───┐
│ title           │   │   │ owner_id (FK)   │   │
│ source_language │   │   │ kind            │   │
│ target_language │   │   │ storage_path    │   │
│ created_at      │   │   │ size_bytes      │   │
└────────┬────────┘   │   └─────────────────┘   │
         │            │                         │
         │ 1:N        └─────────────────────────┤
         ▼                                      │
┌─────────────────┐       ┌─────────────────┐   │
│ processing_jobs │       │ subtitle_tracks │   │
├─────────────────┤       ├─────────────────┤   │
│ id (PK)         │       │ id (PK)         │   │
│ project_id (FK) │       │ project_id (FK) │   │
│ media_file_id   │       │ media_file_id   │◀──┘
│ job_type        │       │ track_type      │
│ status          │       │ language        │
│ progress        │       │ storage_path    │
│ error           │       │ cue_count       │
└─────────────────┘       └─────────────────┘
```

### Tables Chi Tiết

#### `projects`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| owner_id | UUID | FK → auth.users |
| title | TEXT | Tên dự án |
| source_language | TEXT | Ngôn ngữ gốc (default: 'auto') |
| target_language | TEXT | Ngôn ngữ đích |
| created_at | TIMESTAMPTZ | Thời gian tạo |
| updated_at | TIMESTAMPTZ | Thời gian cập nhật |

#### `media_files`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| owner_id | UUID | FK → auth.users |
| kind | TEXT | 'audio' hoặc 'video' |
| original_filename | TEXT | Tên file gốc |
| mime_type | TEXT | MIME type |
| size_bytes | BIGINT | Kích thước (bytes) |
| storage_bucket | TEXT | Bucket name |
| storage_path | TEXT | Đường dẫn trong storage |
| duration_seconds | NUMERIC | Thời lượng (giây) |

#### `subtitle_tracks`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| media_file_id | UUID | FK → media_files |
| owner_id | UUID | FK → auth.users |
| track_type | TEXT | 'original' hoặc 'translated' |
| language | TEXT | Mã ngôn ngữ (en, vi, ja...) |
| format | TEXT | Định dạng ('vtt') |
| storage_bucket | TEXT | Bucket name |
| storage_path | TEXT | Đường dẫn trong storage |
| cue_count | INT | Số lượng cue |

#### `processing_jobs`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| media_file_id | UUID | FK → media_files |
| owner_id | UUID | FK → auth.users |
| job_type | TEXT | 'transcribe' hoặc 'translate' |
| status | TEXT | 'queued', 'running', 'succeeded', 'failed' |
| progress | NUMERIC | Tiến độ (0-1) |
| error | TEXT | Thông báo lỗi (nếu có) |
| result_track_id | UUID | FK → subtitle_tracks |

### Row Level Security (RLS)

Tất cả các bảng đều bật RLS với policy:
```sql
-- Chỉ owner mới có quyền CRUD
auth.uid() = owner_id
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/callback` | Xử lý magic link callback |

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/signed-url` | Lấy signed URL để upload |
| POST | `/api/upload/confirm` | Xác nhận upload thành công |

**Request: `/api/upload/signed-url`**
```json
{
  "projectId": "uuid",
  "filename": "video.mp4",
  "contentType": "video/mp4",
  "fileSize": 104857600
}
```

**Response:**
```json
{
  "signedUrl": "https://...",
  "storagePath": "userId/projectId/fileId-video.mp4",
  "mediaFileId": "uuid"
}
```

### AI Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/transcribe` | Tạo phụ đề từ audio |
| POST | `/api/ai/translate` | Dịch phụ đề |

**Request: `/api/ai/transcribe`**
```json
{
  "projectId": "uuid",
  "mediaFileId": "uuid"
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "queued",
  "message": "Transcription started"
}
```

**Request: `/api/ai/translate`**
```json
{
  "projectId": "uuid",
  "originalTrackId": "uuid",
  "targetLanguage": "vi"
}
```

### Player

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/player/urls` | Lấy signed URLs cho player |

**Query params:** `?projectId=...&mediaFileId=...`

**Response:**
```json
{
  "mediaUrl": "https://... (signed)",
  "originalTrackUrl": "https://... (signed)",
  "translatedTrackUrl": "https://... (signed)"
}
```

---

## 📂 Cấu Trúc Thư Mục

```
linguasync/
├── 📁 docs/
│   ├── GIOI_THIEU_DU_AN.md      # File này
│   └── HUONG_DAN_SU_DUNG.md     # Hướng dẫn sử dụng
│
├── 📁 supabase/
│   ├── schema.sql               # Database schema
│   └── storage-policies.sql     # Storage RLS policies
│
├── 📁 src/
│   ├── 📁 app/                  # Next.js App Router
│   │   ├── 📁 api/
│   │   │   ├── 📁 ai/
│   │   │   │   ├── transcribe/route.ts
│   │   │   │   └── translate/route.ts
│   │   │   ├── 📁 player/
│   │   │   │   └── urls/route.ts
│   │   │   └── 📁 upload/
│   │   │       ├── confirm/route.ts
│   │   │       └── signed-url/route.ts
│   │   │
│   │   ├── 📁 auth/callback/    # Auth callback
│   │   ├── 📁 dashboard/        # Dashboard page
│   │   ├── 📁 login/            # Login page
│   │   ├── 📁 projects/
│   │   │   ├── 📁 [id]/         # Project detail
│   │   │   └── 📁 new/          # New project
│   │   │
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   │
│   ├── 📁 components/
│   │   ├── 📁 layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── 📁 player/
│   │   │   └── DualSubPlayer.tsx
│   │   │
│   │   ├── 📁 projects/
│   │   │   └── ProjectCard.tsx
│   │   │
│   │   ├── 📁 ui/               # shadcn/ui components
│   │   │   └── ...
│   │   │
│   │   └── 📁 upload/
│   │       └── UploadDropzone.tsx
│   │
│   ├── 📁 lib/
│   │   ├── 📁 ai/
│   │   │   └── openai.ts        # OpenAI client
│   │   │
│   │   ├── 📁 db/
│   │   │   └── types.ts         # TypeScript interfaces
│   │   │
│   │   ├── 📁 supabase/
│   │   │   ├── admin.ts         # Service role client
│   │   │   ├── client.ts        # Browser client
│   │   │   └── server.ts        # Server client
│   │   │
│   │   ├── 📁 vtt/
│   │   │   ├── format.ts        # VTT formatting
│   │   │   └── parse.ts         # VTT parsing
│   │   │
│   │   └── utils.ts             # Utilities
│   │
│   └── middleware.ts            # Auth middleware
│
├── .env.local.example           # Environment template
├── package.json
├── README.md
└── tsconfig.json
```

---

## 🎯 Roadmap

### ✅ MVP (Completed)

- [x] User authentication (Magic Link)
- [x] Project management (CRUD)
- [x] Large file upload (500MB, progress tracking)
- [x] AI Transcription (Whisper)
- [x] AI Translation (GPT-4)
- [x] Dual subtitle player
- [x] Line-level highlighting

### 🔄 Phase 2 (Planned)

- [ ] Download VTT/SRT files
- [ ] Edit subtitles inline
- [ ] Subtitle offset adjustment
- [ ] Multiple target languages per project
- [ ] Share project via public link

### 🚀 Phase 3 (Future)

- [ ] Word-level highlighting (karaoke style)
- [ ] YouTube URL import
- [ ] Batch processing
- [ ] Team collaboration
- [ ] API for third-party integration
- [ ] Mobile app (React Native)

---

## 🔐 Bảo Mật

### Security Measures

| Layer | Measure |
|-------|---------|
| **Auth** | Supabase Auth với Magic Link (no passwords) |
| **Database** | Row Level Security (RLS) - chỉ owner truy cập |
| **Storage** | Private buckets + Signed URLs (1 hour expiry) |
| **API** | Session validation trên mọi request |
| **Upload** | File type validation + Size limits |

### Environment Variables

```env
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Secret (server only)
SUPABASE_SERVICE_ROLE_KEY=    # ⚠️ Never expose
OPENAI_API_KEY=               # ⚠️ Never expose
```

---

## 📊 Performance

### Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Code Splitting** | Next.js automatic + dynamic imports |
| **Streaming** | Server Components (React 18) |
| **Caching** | ISR cho static pages |
| **Binary Search** | O(log n) tìm cue đang active |
| **requestAnimationFrame** | Smooth subtitle highlighting |

### Limits

| Resource | Limit |
|----------|-------|
| File upload | 500 MB |
| Transcription timeout | 5 minutes |
| Translation timeout | 5 minutes |
| Signed URL expiry | 1 hour |

---

## 🤝 Contributing

1. Fork repository
2. Tạo branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Tạo Pull Request

---

## 📄 License

MIT License - xem file [LICENSE](../LICENSE)

---

## 🙏 Credits

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [OpenAI](https://openai.com/) - AI Models
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Lucide](https://lucide.dev/) - Icons

---

<p align="center">
  Made with ❤️ by LinguaSync Team
</p>

<p align="center">
  <sub>© 2026 LinguaSync. All rights reserved.</sub>
</p>
