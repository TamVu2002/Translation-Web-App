'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, Loader2, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Project, MediaFile } from '@/lib/db/types';

interface DashboardClientProps {
  initialProjects: (Project & { media_files: MediaFile[] })[];
}

export function DashboardClient({ initialProjects }: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [projects, setProjects] = useState(initialProjects);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteClick = (projectId: string) => {
    setDeleteId(projectId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    
    try {
      // Use API to delete project + storage files
      const response = await fetch(`/api/projects/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      const result = await response.json();
      
      // Update local state
      setProjects(projects.filter(p => p.id !== deleteId));
      
      // Clear browser cache for this project
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (e) {
          console.warn('Cache clear failed:', e);
        }
      }
      
      toast.success('Đã xóa dự án thành công', {
        description: `Đã xóa ${result.deletedFiles?.media || 0} file media và ${result.deletedFiles?.subtitles || 0} file phụ đề`,
      });
      
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Không thể xóa dự án', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const projectToDelete = projects.find(p => p.id === deleteId);
  
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="container py-6 md:py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="animate-slide-down">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bảng Điều Khiển</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý các dự án dịch thuật của bạn
            </p>
          </div>
          <Button className="btn-shine hover-glow w-full sm:w-auto animate-slide-down stagger-1" asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo Dự Án Mới
            </Link>
          </Button>
        </div>

        {/* Search & Stats */}
        {projects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm dự án..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-3 py-1 rounded-full bg-muted">
                {filteredProjects.length} / {projects.length} dự án
              </span>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProjects.map((project, index) => (
              <div 
                key={project.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProjectCard 
                  project={project} 
                  onDelete={handleDeleteClick}
                />
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy dự án</h3>
            <p className="text-muted-foreground mb-4">
              Không có dự án nào khớp với "{searchQuery}"
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 md:py-16 animate-scale-in">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center animate-float">
                <FolderOpen className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-background border-2 shadow-lg flex items-center justify-center animate-bounce-soft">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Chưa có dự án nào</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto px-4">
              Tạo dự án đầu tiên để bắt đầu phiên âm và dịch các tệp media của bạn.
            </p>
            <Button className="btn-shine" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Tạo Dự Án Đầu Tiên
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Dự Án?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{projectToDelete?.title}</strong>?
              <br />
              <span className="text-destructive">
                Thao tác này sẽ xóa vĩnh viễn tất cả tệp media, phụ đề và công việc xử lý. 
                Không thể hoàn tác.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa Dự Án'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
