'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  FileAudio, 
  FileVideo,
  Calendar,
  Languages,
  Trash2,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project, MediaFile } from '@/lib/db/types';
import { getLanguageName } from '@/lib/constants';

interface ProjectCardProps {
  project: Project & { media_files?: MediaFile[] };
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const mediaFile = project.media_files?.[0];
  const hasMedia = !!mediaFile;
  const isVideo = mediaFile?.kind === 'video';
  const MediaIcon = isVideo ? FileVideo : FileAudio;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="group card-interactive overflow-hidden h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              hasMedia 
                ? 'bg-gradient-to-br from-primary/20 to-primary/5' 
                : 'bg-muted'
            }`}>
              {hasMedia ? (
                <MediaIcon className="h-5 w-5 text-primary" />
              ) : (
                <FileVideo className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <CardTitle className="text-base font-semibold line-clamp-1">
              {project.title}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở Dự Án
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => onDelete(project.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Languages className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {getLanguageName(project.source_language)}
            {' → '}
            {getLanguageName(project.target_language)}
          </span>
        </div>
        
        {hasMedia && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs capitalize">
              {mediaFile.kind === 'video' ? 'Video' : 'Âm thanh'}
            </Badge>
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {mediaFile.original_filename}
            </span>
          </div>
        )}
        
        {!hasMedia && (
          <p className="text-sm text-muted-foreground italic">Chưa tải lên media</p>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 border-t bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(project.created_at)}
        </div>
      </CardFooter>
      </Card>
    </Link>
  );
}
