'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  Captions, 
  Play, 
  FileVideo, 
  FileAudio,
  Languages,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { DualSubPlayer } from '@/components/player/DualSubPlayer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Project, MediaFile, SubtitleTrack, ProcessingJob } from '@/lib/db/types';
import { getLanguageName } from '@/lib/constants';

interface ProjectDetailClientProps {
  project: Project & { 
    media_files: MediaFile[];
    processing_jobs: ProcessingJob[];
  };
  subtitleTracks: SubtitleTrack[];
  userId: string;
}

export function ProjectDetailClient({ 
  project: initialProject, 
  subtitleTracks: initialTracks,
  userId 
}: ProjectDetailClientProps) {
  const supabase = createClient();
  
  const [project] = useState(initialProject);
  const [mediaFiles, setMediaFiles] = useState(initialProject.media_files);
  const [subtitleTracks, setSubtitleTracks] = useState(initialTracks);
  const [processingJobs, setProcessingJobs] = useState(initialProject.processing_jobs);
  const [activeTab, setActiveTab] = useState('upload');
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [playerUrls, setPlayerUrls] = useState<{
    mediaUrl: string;
    originalTrackUrl: string | null;
    translatedTrackUrl: string | null;
  } | null>(null);

  const mediaFile = mediaFiles[0];
  const originalTrack = subtitleTracks.find(t => t.track_type === 'original');
  const translatedTrack = subtitleTracks.find(t => t.track_type === 'translated');

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    const { data: job } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (job) {
      setProcessingJobs(prev => 
        prev.map(j => j.id === jobId ? job : j)
      );
      
      if (job.status === 'succeeded' && job.result_track_id) {
        // Fetch the new track
        const { data: track } = await supabase
          .from('subtitle_tracks')
          .select('*')
          .eq('id', job.result_track_id)
          .single();
        
        if (track) {
          setSubtitleTracks(prev => {
            const existing = prev.find(t => t.id === track.id);
            if (existing) {
              return prev.map(t => t.id === track.id ? track : t);
            }
            return [...prev, track];
          });
        }
      }
      
      return job.status;
    }
    return null;
  }, [supabase]);

  const handleUploadComplete = async (mediaFileId: string) => {
    // Refresh media files
    const { data } = await supabase
      .from('media_files')
      .select('*')
      .eq('project_id', project.id);
    
    if (data) {
      setMediaFiles(data);
    }
    
    toast.success('Tải lên thành công! 🎉');
    setActiveTab('subtitles');
  };

  const handleTranscribe = async () => {
    if (!mediaFile) return;
    
    setIsTranscribing(true);
    
    try {
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          mediaFileId: mediaFile.id,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Phiên âm thất bại');
      }

      // Poll for completion
      const jobId = result.jobId;
      const pollInterval = setInterval(async () => {
        const status = await pollJobStatus(jobId);
        if (status === 'succeeded' || status === 'failed') {
          clearInterval(pollInterval);
          setIsTranscribing(false);
          
          if (status === 'succeeded') {
            toast.success('Phiên âm hoàn tất! 🎉');
          } else {
            toast.error('Phiên âm thất bại');
          }
        }
      }, 2000);

    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Phiên âm thất bại', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
      setIsTranscribing(false);
    }
  };

  const handleTranslate = async () => {
    if (!originalTrack) return;
    
    setIsTranslating(true);
    
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          originalTrackId: originalTrack.id,
          targetLanguage: project.target_language,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Dịch thuật thất bại');
      }

      // Poll for completion
      const jobId = result.jobId;
      const pollInterval = setInterval(async () => {
        const status = await pollJobStatus(jobId);
        if (status === 'succeeded' || status === 'failed') {
          clearInterval(pollInterval);
          setIsTranslating(false);
          
          if (status === 'succeeded') {
            toast.success('Dịch hoàn tất! 🎉');
          } else {
            toast.error('Dịch thuật thất bại');
          }
        }
      }, 2000);

    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Dịch thuật thất bại', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
      setIsTranslating(false);
    }
  };

  // Load player URLs when viewing player tab
  useEffect(() => {
    if (activeTab === 'player' && mediaFile) {
      const loadPlayerUrls = async () => {
        try {
          const response = await fetch(
            `/api/player/urls?projectId=${project.id}&mediaFileId=${mediaFile.id}`
          );
          
          if (response.ok) {
            const urls = await response.json();
            setPlayerUrls(urls);
          }
        } catch (error) {
          console.error('Error loading player URLs:', error);
        }
      };
      
      loadPlayerUrls();
    }
  }, [activeTab, mediaFile, project.id]);

  const getJobStatus = (jobType: 'transcribe' | 'translate') => {
    const job = processingJobs
      .filter(j => j.job_type === jobType)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    return job;
  };

  const transcribeJob = getJobStatus('transcribe');
  const translateJob = getJobStatus('translate');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-background via-muted/30 to-background rounded-2xl p-6 border shadow-sm animate-slide-down">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại Bảng Điều Khiển
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{project.title}</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Languages className="h-4 w-4" />
                <span>
                  {getLanguageName(project.source_language)}
                  {' → '}
                  {getLanguageName(project.target_language)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-12 bg-muted/50 p-1">
          <TabsTrigger 
            value="upload" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Tải Lên</span>
          </TabsTrigger>
          <TabsTrigger 
            value="subtitles" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            <Captions className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Phụ Đề</span>
          </TabsTrigger>
          <TabsTrigger 
            value="player" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Xem</span>
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-6">
          <div className="max-w-2xl">
            {mediaFile ? (
              <Card className="animate-scale-in border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      mediaFile.kind === 'video' 
                        ? 'bg-gradient-to-br from-primary/20 to-chart-2/20' 
                        : 'bg-gradient-to-br from-chart-4/20 to-chart-5/20'
                    }`}>
                      {mediaFile.kind === 'video' ? (
                        <FileVideo className="h-7 w-7 text-primary" />
                      ) : (
                        <FileAudio className="h-7 w-7 text-chart-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-lg">{mediaFile.original_filename}</CardTitle>
                      <CardDescription>
                        {(mediaFile.size_bytes / (1024 * 1024)).toFixed(1)} MB • {mediaFile.kind === 'video' ? 'Video' : 'Âm thanh'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Đã tải
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    File đã được tải lên. Chuyển sang tab <strong>Phụ Đề</strong> để phiên âm và dịch.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <UploadDropzone
                projectId={project.id}
                userId={userId}
                onUploadComplete={handleUploadComplete}
                onError={(error) => toast.error(error)}
              />
            )}
          </div>
        </TabsContent>

        {/* Subtitles Tab */}
        <TabsContent value="subtitles" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl">
            {/* Transcription Card */}
            <Card className="card-interactive">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 flex items-center justify-center">
                    <Captions className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Phiên Âm</CardTitle>
                    <CardDescription>
                      Tạo phụ đề từ giọng nói bằng AI
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!mediaFile ? (
                  <p className="text-sm text-muted-foreground">
                    Vui lòng tải lên file media trước để bắt đầu phiên âm.
                  </p>
                ) : originalTrack ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Phiên Âm Hoàn Tất</span>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <p>Ngôn ngữ: <strong>{getLanguageName(originalTrack.language)}</strong></p>
                      <p>Số câu: <strong>{originalTrack.cue_count || 'N/A'}</strong></p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleTranscribe}
                      disabled={isTranscribing}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Phiên Âm Lại
                    </Button>
                  </div>
                ) : transcribeJob?.status === 'running' || isTranscribing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Đang phiên âm...</span>
                    </div>
                    <Progress value={transcribeJob?.progress ? transcribeJob.progress * 100 : 30} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Quá trình này có thể mất vài phút tùy thuộc độ dài file.
                    </p>
                  </div>
                ) : transcribeJob?.status === 'failed' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Phiên Âm Thất Bại</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transcribeJob.error || 'Đã xảy ra lỗi'}
                    </p>
                    <Button 
                      className="w-full"
                      onClick={handleTranscribe}
                    >
                      Thử Lại
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full btn-shine"
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Bắt Đầu Phiên Âm
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Translation Card */}
            <Card className="card-interactive">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-5/20 to-chart-5/5 flex items-center justify-center">
                    <Languages className="h-5 w-5 text-chart-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dịch Thuật</CardTitle>
                    <CardDescription>
                      Dịch sang {getLanguageName(project.target_language)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!originalTrack ? (
                  <p className="text-sm text-muted-foreground">
                    Hoàn thành phiên âm trước để có thể dịch thuật.
                  </p>
                ) : translatedTrack ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Dịch Thuật Hoàn Tất</span>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <p>Ngôn ngữ: <strong>{getLanguageName(translatedTrack.language)}</strong></p>
                      <p>Số câu: <strong>{translatedTrack.cue_count || 'N/A'}</strong></p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleTranslate}
                      disabled={isTranslating}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Dịch Lại
                    </Button>
                  </div>
                ) : translateJob?.status === 'running' || isTranslating ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Đang dịch...</span>
                    </div>
                    <Progress value={translateJob?.progress ? translateJob.progress * 100 : 30} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Đang dịch phụ đề và giữ nguyên thời gian hiển thị...
                    </p>
                  </div>
                ) : translateJob?.status === 'failed' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Dịch Thuật Thất Bại</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {translateJob.error || 'Đã xảy ra lỗi'}
                    </p>
                    <Button 
                      className="w-full"
                      onClick={handleTranslate}
                    >
                      Thử Lại
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full btn-shine"
                    onClick={handleTranslate}
                    disabled={isTranslating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Bắt Đầu Dịch
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Player Tab */}
        <TabsContent value="player" className="mt-6">
          <div className="max-w-4xl">
            {playerUrls ? (
              <div className="animate-scale-in">
                <DualSubPlayer
                  mediaUrl={playerUrls.mediaUrl}
                  originalVttUrl={playerUrls.originalTrackUrl}
                  translatedVttUrl={playerUrls.translatedTrackUrl}
                  isVideo={mediaFile?.kind === 'video'}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Đang tải trình phát...</p>
                </CardContent>
              </Card>
            )}
            
            {/* Subtitle status */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${originalTrack ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-muted-foreground">
                  Phụ đề gốc: {originalTrack ? 'Có sẵn' : 'Chưa có'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${translatedTrack ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-muted-foreground">
                  Phụ đề dịch: {translatedTrack ? 'Có sẵn' : 'Chưa có'}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
