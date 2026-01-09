# 📖 Hướng Dẫn Sử Dụng LinguaSync

## Mục Lục

1. [Giới thiệu](#giới-thiệu)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt](#cài-đặt)
4. [Đăng ký & Đăng nhập](#đăng-ký--đăng-nhập)
5. [Tạo dự án mới](#tạo-dự-án-mới)
6. [Tải lên media](#tải-lên-media)
7. [Tạo phụ đề (Transcribe)](#tạo-phụ-đề-transcribe)
8. [Dịch phụ đề (Translate)](#dịch-phụ-đề-translate)
9. [Xem video với phụ đề kép](#xem-video-với-phụ-đề-kép)
10. [Câu hỏi thường gặp](#câu-hỏi-thường-gặp)

---

## Giới thiệu

**LinguaSync** là ứng dụng web giúp bạn:
- Tự động tạo phụ đề từ video/audio bằng AI (OpenAI Whisper)
- Dịch phụ đề sang ngôn ngữ khác bằng GPT-4
- Xem video với 2 dòng phụ đề đồng thời (gốc + dịch)

Phù hợp cho:
- Học ngoại ngữ qua video
- Dịch video YouTube, podcast
- Tạo phụ đề cho nội dung cá nhân

---

## Yêu cầu hệ thống

### Để chạy ứng dụng (Developer)
- Node.js 18 trở lên
- Tài khoản Supabase (miễn phí)
- API Key OpenAI (có phí)

### Để sử dụng (End User)
- Trình duyệt web hiện đại (Chrome, Firefox, Edge, Safari)
- Kết nối internet ổn định

---

## Cài đặt

### Bước 1: Clone dự án

```bash
git clone <repository-url>
cd linguasync
npm install
```

### Bước 2: Tạo tài khoản Supabase

1. Truy cập [supabase.com](https://supabase.com) và đăng ký
2. Tạo project mới
3. Lấy thông tin từ **Settings > API**:
   - Project URL
   - Anon Key
   - Service Role Key

### Bước 3: Thiết lập Database

1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy nội dung file `supabase/schema.sql` và chạy
3. Copy nội dung file `supabase/storage-policies.sql` và chạy

### Bước 4: Tạo Storage Buckets

1. Vào **Storage** trong Supabase Dashboard
2. Tạo bucket tên `media` (Private)
3. Tạo bucket tên `subtitles` (Private)

### Bước 5: Cấu hình Environment

Tạo file `.env.local` tại thư mục gốc:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
OPENAI_API_KEY=sk-...
```

### Bước 6: Chạy ứng dụng

```bash
npm run dev
```

Mở trình duyệt: [http://localhost:3000](http://localhost:3000)

---

## Đăng ký & Đăng nhập

LinguaSync sử dụng **Magic Link** - đăng nhập không cần mật khẩu.

### Các bước:

1. Truy cập trang **Login** hoặc click **Get Started**
2. Nhập địa chỉ email của bạn
3. Click **Send magic link**
4. Kiểm tra hộp thư email (kể cả thư mục Spam)
5. Click vào link trong email để đăng nhập

> ⚠️ **Lưu ý**: Link chỉ có hiệu lực trong 1 giờ

---

## Tạo dự án mới

Mỗi video/audio cần được tổ chức trong một **Project**.

### Các bước:

1. Từ Dashboard, click **New Project** hoặc **+ New Project**
2. Điền thông tin:
   - **Project Title**: Tên dự án (VD: "Bài học tiếng Anh số 1")
   - **Source Language**: Ngôn ngữ gốc của video
     - Chọn `Auto-detect` nếu không chắc chắn
   - **Target Language**: Ngôn ngữ muốn dịch sang (VD: Vietnamese)
3. Click **Create Project**

Bạn sẽ được chuyển đến trang chi tiết dự án.

---

## Tải lên media

### Định dạng hỗ trợ:
- **Video**: MP4, WebM, MOV
- **Audio**: MP3, WAV, M4A

### Giới hạn:
- Kích thước tối đa: **500 MB**

### Các bước:

1. Trong trang Project, chọn tab **Upload**
2. Kéo thả file vào vùng upload HOẶC click để chọn file
3. Chờ quá trình upload hoàn tất (có thanh progress)
4. Khi thấy ✅ **Upload complete!**, file đã sẵn sàng

> 💡 **Mẹo**: File nhỏ hơn sẽ xử lý nhanh hơn. Nếu video dài, cân nhắc cắt thành nhiều phần.

---

## Tạo phụ đề (Transcribe)

Chức năng này sử dụng **OpenAI Whisper** để chuyển đổi giọng nói thành văn bản.

### Các bước:

1. Chuyển sang tab **Subtitles**
2. Trong phần **Transcription**, click **Start Transcription**
3. Chờ xử lý (thời gian phụ thuộc vào độ dài video)
   - Video 5 phút: ~1-2 phút
   - Video 30 phút: ~5-10 phút
4. Khi hoàn tất, bạn sẽ thấy:
   - ✅ **Transcription Complete**
   - Ngôn ngữ được phát hiện
   - Số lượng cue (đoạn phụ đề)

### Nếu thất bại:

- Kiểm tra định dạng file có được hỗ trợ không
- Đảm bảo file có âm thanh rõ ràng
- Click **Try Again** để thử lại

---

## Dịch phụ đề (Translate)

Chức năng này sử dụng **GPT-4** để dịch phụ đề sang ngôn ngữ đích.

### Yêu cầu:
- Phải hoàn thành Transcription trước

### Các bước:

1. Trong tab **Subtitles**, phần **Translation**
2. Click **Start Translation**
3. Chờ xử lý (thường nhanh hơn transcription)
4. Khi hoàn tất, bạn sẽ thấy:
   - ✅ **Translation Complete**
   - Ngôn ngữ đích
   - Số lượng cue (phải bằng với bản gốc)

### Đặc điểm:
- Timestamp được giữ nguyên từ bản gốc
- Mỗi câu được dịch riêng, đảm bảo đồng bộ
- Có thể dịch lại bằng cách click **Re-translate**

---

## Xem video với phụ đề kép

Đây là tính năng chính của LinguaSync!

### Các bước:

1. Chuyển sang tab **Player**
2. Video/Audio sẽ tự động load
3. Click nút Play hoặc click vào video để phát

### Giao diện Player:

```
┌─────────────────────────────────────┐
│                                     │
│         [Video/Audio Area]          │
│                                     │
│   ┌─────────────────────────────┐   │
│   │    Original subtitle line   │   │  ← Phụ đề gốc (nền đen)
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │   Translated subtitle line  │   │  ← Phụ đề dịch (nền xanh)
│   └─────────────────────────────┘   │
│                                     │
│ ──●─────────────────────── 2:30/10:00│  ← Thanh tiến trình
│                                     │
│ [⏮] [▶️] [⏭]              🔊━━━ [⛶] │  ← Điều khiển
└─────────────────────────────────────┘
```

### Các nút điều khiển:

| Nút | Chức năng |
|-----|-----------|
| ⏮ | Tua lùi 10 giây |
| ▶️/⏸ | Phát/Tạm dừng |
| ⏭ | Tua tiến 10 giây |
| 🔊 | Điều chỉnh âm lượng |
| ⛶ | Toàn màn hình |

### Mẹo sử dụng:

- **Click vào thanh tiến trình** để nhảy đến vị trí bất kỳ
- **Phụ đề highlight tự động** theo thời gian video
- **Fullscreen** để xem trải nghiệm tốt nhất

---

## Câu hỏi thường gặp

### Q: Tại sao transcription mất nhiều thời gian?

**A**: OpenAI Whisper cần xử lý toàn bộ file audio. Video dài sẽ mất nhiều thời gian hơn. Bạn có thể:
- Cắt video thành nhiều phần nhỏ
- Sử dụng file audio thay vì video (nhẹ hơn)

---

### Q: Phụ đề dịch bị sai nghĩa?

**A**: GPT-4 dịch tự động và có thể không hoàn hảo. Bạn có thể:
- Click **Re-translate** để dịch lại
- Tải file VTT về và chỉnh sửa thủ công

---

### Q: Có thể tải phụ đề về không?

**A**: Hiện tại chưa có nút download trực tiếp. Bạn có thể:
- Truy cập Supabase Storage để tải file VTT
- Chúng tôi sẽ bổ sung tính năng này trong bản cập nhật

---

### Q: Hỗ trợ những ngôn ngữ nào?

**A**: 
- **Transcription**: Whisper hỗ trợ 99+ ngôn ngữ
- **Translation**: GPT-4 hỗ trợ hầu hết các ngôn ngữ phổ biến

Các ngôn ngữ có sẵn trong app:
- Tiếng Việt, Tiếng Anh, Tiếng Nhật, Tiếng Hàn, Tiếng Trung
- Tiếng Pháp, Tiếng Đức, Tiếng Tây Ban Nha, Tiếng Bồ Đào Nha
- Tiếng Nga, Tiếng Ả Rập, Tiếng Hindi, Tiếng Thái, Tiếng Indonesia

---

### Q: Chi phí sử dụng?

**A**: 
- **Supabase**: Free tier đủ dùng cho cá nhân
- **OpenAI API**: Tính phí theo sử dụng
  - Whisper: ~$0.006/phút audio
  - GPT-4: ~$0.01-0.03/1000 tokens

Ước tính: Video 10 phút ~ $0.10-0.20

---

### Q: Lỗi "Failed to create upload URL"?

**A**: Kiểm tra:
1. Storage bucket `media` đã được tạo chưa
2. Storage policies đã được cấu hình chưa
3. SUPABASE_SERVICE_ROLE_KEY đúng chưa

---

### Q: Phụ đề bị lệch thời gian?

**A**: Có thể do:
- Video đã bị cắt/edit sau khi transcribe
- Định dạng video không chuẩn

Giải pháp: Upload lại video gốc và transcribe lại.

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra mục [Câu hỏi thường gặp](#câu-hỏi-thường-gặp)
2. Tạo issue trên GitHub repository
3. Liên hệ qua email: [your-email@example.com]

---

*Cập nhật lần cuối: Tháng 1, 2026*
