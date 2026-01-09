import type { VTTCue } from '@/lib/db/types';

/**
 * Convert seconds to VTT timestamp format (HH:MM:SS.mmm)
 */
export function secondsToTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = Math.floor(secs).toString().padStart(2, '0');
  const ms = Math.round((secs - Math.floor(secs)) * 1000).toString().padStart(3, '0');
  
  return `${hh}:${mm}:${ss}.${ms}`;
}

/**
 * Convert VTT timestamp to seconds
 */
export function timestampToSeconds(timestamp: string): number {
  // Handle both HH:MM:SS.mmm and MM:SS.mmm formats
  const parts = timestamp.trim().split(':');
  
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseFloat(minutes) * 60 + parseFloat(seconds);
  }
  
  return 0;
}

/**
 * Build a VTT string from cues
 */
export function buildVTT(cues: VTTCue[]): string {
  let vtt = 'WEBVTT\n\n';
  
  for (const cue of cues) {
    const startTs = secondsToTimestamp(cue.start);
    const endTs = secondsToTimestamp(cue.end);
    vtt += `${cue.index}\n`;
    vtt += `${startTs} --> ${endTs}\n`;
    vtt += `${cue.text.trim()}\n\n`;
  }
  
  return vtt;
}

/**
 * Convert Whisper verbose_json segments to VTT cues
 */
export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export function whisperSegmentsToVTT(segments: WhisperSegment[]): string {
  const cues: VTTCue[] = segments.map((segment, index) => ({
    index: index + 1,
    start: segment.start,
    end: segment.end,
    text: segment.text.trim(),
  }));
  
  return buildVTT(cues);
}

/**
 * Create translated VTT using original timestamps and translated texts
 */
export function buildTranslatedVTT(originalCues: VTTCue[], translatedTexts: string[]): string {
  if (originalCues.length !== translatedTexts.length) {
    throw new Error(`Cue count mismatch: ${originalCues.length} original vs ${translatedTexts.length} translated`);
  }
  
  const translatedCues: VTTCue[] = originalCues.map((cue, index) => ({
    index: cue.index,
    start: cue.start,
    end: cue.end,
    text: translatedTexts[index].trim(),
  }));
  
  return buildVTT(translatedCues);
}
