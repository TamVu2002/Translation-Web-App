'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FolderPlus, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { LANGUAGES, SOURCE_LANGUAGES } from '@/lib/constants';

export function NewProjectForm() {
  const router = useRouter();
  const supabase = createClient();
  
  const [title, setTitle] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên dự án');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Vui lòng đăng nhập để tạo dự án');
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          source_language: sourceLanguage,
          target_language: targetLanguage,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Tạo dự án thành công! 🎉');
      router.push(`/projects/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Không thể tạo dự án', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-6 md:py-8 px-4">
      {/* Back link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Bảng Điều Khiển
      </Link>

      <Card className="animate-scale-in shadow-lg border-0 bg-card/80 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
              <FolderPlus className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Tạo Dự Án Mới</CardTitle>
              <CardDescription>
                Thiết lập thông tin dự án dịch thuật của bạn
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Tên Dự Án <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="VD: Dịch video marketing, Phụ đề phim..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                required
                className="h-11"
              />
            </div>

            {/* Source Language */}
            <div className="space-y-2">
              <Label htmlFor="source" className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Ngôn Ngữ Gốc
              </Label>
              <Select 
                value={sourceLanguage} 
                onValueChange={setSourceLanguage}
                disabled={isLoading}
              >
                <SelectTrigger id="source" className="h-11">
                  <SelectValue placeholder="Chọn ngôn ngữ gốc" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Tự động nhận diện phù hợp với hầu hết các trường hợp
              </p>
            </div>

            {/* Target Language */}
            <div className="space-y-2">
              <Label htmlFor="target" className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Ngôn Ngữ Đích
              </Label>
              <Select 
                value={targetLanguage} 
                onValueChange={setTargetLanguage}
                disabled={isLoading}
              >
                <SelectTrigger id="target" className="h-11">
                  <SelectValue placeholder="Chọn ngôn ngữ đích" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ngôn ngữ bạn muốn dịch phụ đề sang
              </p>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-11 btn-shine"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Tạo Dự Án
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
