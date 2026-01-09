// Database types for LinguaSync
// These mirror the Supabase schema

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  source_language: string;
  target_language: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  project_id: string;
  owner_id: string;
  kind: 'audio' | 'video';
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface SubtitleTrack {
  id: string;
  project_id: string;
  media_file_id: string;
  owner_id: string;
  track_type: 'original' | 'translated';
  language: string;
  format: 'vtt';
  storage_bucket: string;
  storage_path: string;
  cue_count: number | null;
  created_at: string;
}

export type JobType = 'transcribe' | 'translate';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ProcessingJob {
  id: string;
  project_id: string;
  media_file_id: string;
  owner_id: string;
  job_type: JobType;
  status: JobStatus;
  error: string | null;
  progress: number | null;
  result_track_id: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ProjectWithMedia extends Project {
  media_files?: MediaFile[];
}

export interface MediaFileWithTracks extends MediaFile {
  subtitle_tracks?: SubtitleTrack[];
}

export interface ProjectDetail extends Project {
  media_files: MediaFileWithTracks[];
  processing_jobs: ProcessingJob[];
}

// API Request/Response types
export interface CreateProjectRequest {
  title: string;
  source_language?: string;
  target_language: string;
}

export interface TranscribeRequest {
  projectId: string;
  mediaFileId: string;
}

export interface TranslateRequest {
  projectId: string;
  originalTrackId: string;
  targetLanguage: string;
}

export interface PlayerUrlsResponse {
  mediaUrl: string;
  originalTrackUrl: string | null;
  translatedTrackUrl: string | null;
}

// VTT Cue type
export interface VTTCue {
  index: number;
  start: number; // seconds
  end: number; // seconds
  text: string;
}
