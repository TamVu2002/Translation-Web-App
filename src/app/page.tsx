import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Languages, 
  FileVideo, 
  Captions, 
  Globe,
  Zap,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Star,
  CheckCircle2,
  Play,
  Headphones
} from 'lucide-react';
import { getUser } from '@/lib/supabase/server';

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 lg:py-32 px-4 overflow-hidden bg-gradient-hero">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-chart-2/10 rounded-full blur-3xl animate-float stagger-2" />
          </div>

          <div className="container mx-auto text-center relative z-10">
            <div className="animate-slide-down">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Công nghệ AI tiên tiến</span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
              Dịch Video & Âm Thanh
              <br />
              <span className="text-gradient">Chính Xác Với AI</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up stagger-1 px-4">
              Tải lên video hoặc audio, AI sẽ tự động tạo phụ đề và dịch sang 
              ngôn ngữ bạn muốn. Xem cùng lúc 2 phụ đề song song.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up stagger-2 px-4">
              {user ? (
                <Button size="lg" className="w-full sm:w-auto btn-shine hover-glow" asChild>
                  <Link href="/dashboard">
                    Đến Bảng Điều Khiển
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="w-full sm:w-auto btn-shine hover-glow" asChild>
                    <Link href="/login">
                      Bắt Đầu Miễn Phí
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto hover-lift" asChild>
                    <Link href="/login">Đăng Nhập</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-12 text-muted-foreground text-sm animate-slide-up stagger-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Bảo mật dữ liệu</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Xử lý nhanh chóng</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Độ chính xác cao</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Tất Cả Những Gì Bạn Cần Để Dịch Media
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto px-4">
                Công cụ hoàn hảo cho YouTuber, giáo viên, doanh nghiệp và bất kỳ ai 
                cần dịch nội dung đa phương tiện.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="card-interactive animate-slide-up stagger-1 group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileVideo className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Tải Lên Mọi Định Dạng</CardTitle>
                  <CardDescription>
                    Hỗ trợ MP4, WebM, MP3, WAV và nhiều định dạng khác. 
                    Dung lượng tối đa 500MB với thanh tiến trình theo dõi.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="card-interactive animate-slide-up stagger-2 group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Captions className="h-6 w-6 text-chart-2" />
                  </div>
                  <CardTitle className="text-lg">Phiên Âm AI</CardTitle>
                  <CardDescription>
                    Sử dụng Groq Whisper - công nghệ chuyển giọng nói thành 
                    văn bản siêu nhanh và hoàn toàn miễn phí.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="card-interactive animate-slide-up stagger-3 group sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-5/20 to-chart-5/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Globe className="h-6 w-6 text-chart-5" />
                  </div>
                  <CardTitle className="text-lg">Dịch Thuật Thông Minh</CardTitle>
                  <CardDescription>
                    Dịch bằng GPT-4 giữ nguyên ngữ cảnh, văn phong 
                    và thời gian xuất hiện phụ đề hoàn hảo.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Cách Hoạt Động
              </h2>
              <p className="text-muted-foreground">
                Chỉ 4 bước đơn giản để có phụ đề chuyên nghiệp
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { step: 1, title: 'Tạo Dự Án', desc: 'Chọn ngôn ngữ đích', icon: Zap, color: 'text-primary' },
                { step: 2, title: 'Tải Media', desc: 'Kéo thả file của bạn', icon: FileVideo, color: 'text-chart-2' },
                { step: 3, title: 'Phiên Âm', desc: 'AI tạo phụ đề tự động', icon: Headphones, color: 'text-chart-4' },
                { step: 4, title: 'Xem & Tải', desc: 'Xem phụ đề song ngữ', icon: Play, color: 'text-chart-5' },
              ].map(({ step, title, desc, icon: Icon, color }) => (
                <div key={step} className="text-center group animate-slide-up" style={{ animationDelay: `${step * 0.1}s` }}>
                  <div className="relative mb-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-muted to-background border-2 border-border flex items-center justify-center mx-auto group-hover:border-primary/50 transition-all group-hover:scale-105">
                      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${color}`} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center shadow-lg">
                      {step}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">{title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Languages */}
        <section className="py-16 md:py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Hỗ Trợ Đa Ngôn Ngữ
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto px-4">
                Dịch phụ đề sang hơn 15 ngôn ngữ phổ biến trên thế giới
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto px-4">
              {[
                '🇻🇳 Tiếng Việt', '🇺🇸 English', '🇯🇵 日本語', '🇰🇷 한국어',
                '🇨🇳 中文', '🇫🇷 Français', '🇩🇪 Deutsch', '🇪🇸 Español',
                '🇵🇹 Português', '🇷🇺 Русский', '🇸🇦 العربية', '🇮🇳 हिन्दी',
                '🇹🇭 ไทย', '🇮🇩 Indonesia'
              ].map((lang, i) => (
                <div 
                  key={lang}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-background border hover:border-primary/50 hover:bg-primary/5 transition-all text-xs sm:text-sm animate-scale-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {lang}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6">
                  Tại Sao Chọn LinguaSync?
                </h2>
                <div className="space-y-4">
                  {[
                    { title: 'Tiết kiệm thời gian', desc: 'Tự động hóa quy trình dịch thủ công mất hàng giờ' },
                    { title: 'Chi phí hợp lý', desc: 'Rẻ hơn nhiều so với thuê dịch giả chuyên nghiệp' },
                    { title: 'Chất lượng cao', desc: 'AI hiểu ngữ cảnh, giữ nguyên ý nghĩa và văn phong' },
                    { title: 'Dễ sử dụng', desc: 'Giao diện tiếng Việt thân thiện, không cần kỹ năng IT' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 animate-slide-in-left" style={{ animationDelay: `${i * 0.1}s` }}>
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl bg-gradient-to-br from-primary/20 via-chart-2/20 to-chart-5/20 flex items-center justify-center animate-float">
                    <Languages className="h-20 w-20 sm:h-28 sm:w-28 text-primary/80" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-background border-2 shadow-xl flex items-center justify-center animate-bounce-soft">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-primary via-primary to-chart-5 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
          
          <div className="container mx-auto text-center relative z-10">
            <div className="animate-bounce-soft inline-block mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto backdrop-blur">
                <Languages className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 animate-slide-up">
              Sẵn Sàng Bắt Đầu Dịch?
            </h2>
            <p className="text-base sm:text-lg opacity-90 mb-8 max-w-xl mx-auto animate-slide-up stagger-1 px-4">
              Tham gia cùng hàng nghìn người dùng tin tưởng LinguaSync 
              cho nhu cầu dịch video và âm thanh.
            </p>
            <Button size="lg" variant="secondary" className="btn-shine hover-scale animate-slide-up stagger-2" asChild>
              <Link href={user ? '/dashboard' : '/login'}>
                {user ? 'Đến Bảng Điều Khiển' : 'Tạo Tài Khoản Miễn Phí'}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Languages className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-bold text-lg">LinguaSync</span>
                <p className="text-xs text-muted-foreground">Dịch Media Thông Minh</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Về Chúng Tôi</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Hướng Dẫn</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Liên Hệ</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Điều Khoản</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 LinguaSync. Bảo lưu mọi quyền.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
