import type { VTTCue } from '@/lib/db/types';
import { timestampToSeconds } from './format';

/**
 * Parse VTT content into an array of cues
 */
export function parseVTT(vttContent: string): VTTCue[] {
  const cues: VTTCue[] = [];
  const lines = vttContent.trim().split('\n');
  
  let i = 0;
  
  // Skip WEBVTT header and any metadata
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }
  
  let cueIndex = 1;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }
    
    // Check if this is a cue index (optional in VTT)
    if (/^\d+$/.test(line)) {
      i++;
      continue;
    }
    
    // Check for timestamp line
    if (line.includes('-->')) {
      const [startPart, endPart] = line.split('-->').map(s => s.trim());
      
      // Extract just the timestamp (remove any settings after the end timestamp)
      const start = timestampToSeconds(startPart);
      const end = timestampToSeconds(endPart.split(' ')[0]);
      
      // Collect text lines until empty line or next timestamp
      const textLines: string[] = [];
      i++;
      
      while (i < lines.length) {
        const textLine = lines[i];
        
        // Check if we've hit the next cue or end
        if (textLine.trim() === '' || textLine.includes('-->') || /^\d+$/.test(textLine.trim())) {
          break;
        }
        
        textLines.push(textLine.trim());
        i++;
      }
      
      const text = textLines.join('\n');
      
      if (text) {
        cues.push({
          index: cueIndex++,
          start,
          end,
          text,
        });
      }
    } else {
      i++;
    }
  }
  
  return cues;
}

/**
 * Extract just the text array from VTT cues (for translation)
 */
export function extractCueTexts(cues: VTTCue[]): string[] {
  return cues.map(cue => cue.text);
}

/**
 * Find the active cue index based on current time (binary search)
 */
export function findActiveCueIndex(cues: VTTCue[], currentTime: number): number {
  if (cues.length === 0) return -1;
  
  let left = 0;
  let right = cues.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const cue = cues[mid];
    
    if (currentTime >= cue.start && currentTime <= cue.end) {
      return mid;
    } else if (currentTime < cue.start) {
      right = mid - 1;
    } else {
      result = mid; // Keep track of the last cue before current time
      left = mid + 1;
    }
  }
  
  // Return -1 if no cue is active
  // Check if we're between cues
  if (result >= 0 && result < cues.length - 1) {
    const currentCue = cues[result];
    if (currentTime > currentCue.end) {
      return -1; // Between cues
    }
  }
  
  return -1;
}

/**
 * Validate VTT content has proper format
 */
export function isValidVTT(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('WEBVTT');
}
