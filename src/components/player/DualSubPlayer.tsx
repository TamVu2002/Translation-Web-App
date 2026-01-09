'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
  PictureInPicture2,
  SkipBack,
  SkipForward,
  Repeat,
  EyeOff,
  PauseCircle,
  List,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { parseVTT, findActiveCueIndex } from '@/lib/vtt/parse';
import type { VTTCue } from '@/lib/db/types';

interface DualSubPlayerProps {
  mediaUrl: string;
  originalVttUrl: string | null;
  translatedVttUrl: string | null;
  isVideo?: boolean;
}

const SUBTITLE_SIZES = [
  { label: 'Nhỏ', value: 'text-base' },
  { label: 'Vừa', value: 'text-xl' },
  { label: 'Lớn', value: 'text-2xl' },
];

export function DualSubPlayer({
  mediaUrl,
  originalVttUrl,
  translatedVttUrl,
  isVideo = true,
}: DualSubPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Subtitle state
  const [originalCues, setOriginalCues] = useState<VTTCue[]>([]);
  const [translatedCues, setTranslatedCues] = useState<VTTCue[]>([]);
  const [activeOriginalIndex, setActiveOriginalIndex] = useState(-1);
  const [activeTranslatedIndex, setActiveTranslatedIndex] = useState(-1);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslated, setShowTranslated] = useState(true);
  const [subtitleSize, setSubtitleSize] = useState('text-xl');
  
  // 🆕 Learning mode states
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopCueIndex, setLoopCueIndex] = useState(-1);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(false);
  const [blurOriginal, setBlurOriginal] = useState(false);
  const [blurTranslated, setBlurTranslated] = useState(false);
  const [hoveredSubtitle, setHoveredSubtitle] = useState<'original' | 'translated' | null>(null);
  const [selectedWord, setSelectedWord] = useState<{word: string, x: number, y: number} | null>(null);
  const [wordMeaning, setWordMeaning] = useState<string | null>(null);
  const [isLoadingMeaning, setIsLoadingMeaning] = useState(false);
  const lastPausedCueRef = useRef(-1);

  // Get media element
  const getMediaElement = useCallback(() => {
    return isVideo ? videoRef.current : audioRef.current;
  }, [isVideo]);

  // Load VTT files
  useEffect(() => {
    const loadVTT = async (url: string): Promise<VTTCue[]> => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch VTT');
        const text = await response.text();
        return parseVTT(text);
      } catch (error) {
        console.error('Error loading VTT:', error);
        return [];
      }
    };

    if (originalVttUrl) {
      loadVTT(originalVttUrl).then(setOriginalCues);
    }
    if (translatedVttUrl) {
      loadVTT(translatedVttUrl).then(setTranslatedCues);
    }
  }, [originalVttUrl, translatedVttUrl]);

  // Update active cue indices
  useEffect(() => {
    if (originalCues.length > 0) {
      const index = findActiveCueIndex(originalCues, currentTime);
      setActiveOriginalIndex(index);
    }
    
    if (translatedCues.length > 0) {
      const index = findActiveCueIndex(translatedCues, currentTime);
      setActiveTranslatedIndex(index);
    }
  }, [currentTime, originalCues, translatedCues]);

  // Auto-scroll transcript
  useEffect(() => {
    if (showTranscript && transcriptRef.current && activeOriginalIndex >= 0) {
      const activeElement = transcriptRef.current.querySelector(`[data-cue-index="${activeOriginalIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeOriginalIndex, showTranscript]);

  // A-B Loop logic
  useEffect(() => {
    if (isLooping && loopCueIndex >= 0 && originalCues[loopCueIndex]) {
      const cue = originalCues[loopCueIndex];
      if (currentTime >= cue.end) {
        const element = getMediaElement();
        if (element) {
          element.currentTime = cue.start;
        }
      }
    }
  }, [currentTime, isLooping, loopCueIndex, originalCues, getMediaElement]);

  // Auto-pause at end of sentence
  useEffect(() => {
    if (autoPauseEnabled && activeOriginalIndex >= 0 && originalCues[activeOriginalIndex]) {
      const cue = originalCues[activeOriginalIndex];
      // Check if we're at the end of current cue and it's a new cue
      if (currentTime >= cue.end - 0.1 && lastPausedCueRef.current !== activeOriginalIndex) {
        const element = getMediaElement();
        if (element && !element.paused) {
          element.pause();
          lastPausedCueRef.current = activeOriginalIndex;
        }
      }
    }
  }, [currentTime, autoPauseEnabled, activeOriginalIndex, originalCues, getMediaElement]);

  // Media events
  useEffect(() => {
    const element = getMediaElement();
    if (!element) return;

    let animationFrame: number;
    
    const updateTime = () => {
      if (element && !element.paused) {
        setCurrentTime(element.currentTime);
        animationFrame = requestAnimationFrame(updateTime);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      animationFrame = requestAnimationFrame(updateTime);
    };

    const handlePause = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animationFrame);
    };

    const handleTimeUpdate = () => setCurrentTime(element.currentTime);
    const handleDurationChange = () => setDuration(element.duration || 0);
    const handleVolumeChange = () => {
      setVolume(element.volume);
      setIsMuted(element.muted);
    };

    const handleProgress = () => {
      if (element.buffered.length > 0) {
        setBuffered(element.buffered.end(element.buffered.length - 1));
      }
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleError = () => { setIsLoading(false); setHasError(true); };
    const handleEnded = () => setIsPlaying(false);

    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('timeupdate', handleTimeUpdate);
    element.addEventListener('durationchange', handleDurationChange);
    element.addEventListener('volumechange', handleVolumeChange);
    element.addEventListener('progress', handleProgress);
    element.addEventListener('loadstart', handleLoadStart);
    element.addEventListener('canplay', handleCanPlay);
    element.addEventListener('waiting', handleWaiting);
    element.addEventListener('playing', handlePlaying);
    element.addEventListener('error', handleError);
    element.addEventListener('ended', handleEnded);

    return () => {
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('timeupdate', handleTimeUpdate);
      element.removeEventListener('durationchange', handleDurationChange);
      element.removeEventListener('volumechange', handleVolumeChange);
      element.removeEventListener('progress', handleProgress);
      element.removeEventListener('loadstart', handleLoadStart);
      element.removeEventListener('canplay', handleCanPlay);
      element.removeEventListener('waiting', handleWaiting);
      element.removeEventListener('playing', handlePlaying);
      element.removeEventListener('error', handleError);
      element.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(animationFrame);
    };
  }, [isVideo, getMediaElement]);

  // Fullscreen handler
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts - Updated for sentence navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const element = getMediaElement();
      if (!element) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          goToPrevCue(); // 🆕 Nhảy về câu trước
          break;
        case 'arrowright':
          e.preventDefault();
          goToNextCue(); // 🆕 Nhảy sang câu sau
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'r':
          e.preventDefault();
          toggleLoop(); // 🆕 Toggle A-B Loop
          break;
        case 'a':
          e.preventDefault();
          setAutoPauseEnabled(prev => !prev); // 🆕 Toggle auto-pause
          break;
        case 'b':
          e.preventDefault();
          setBlurTranslated(prev => !prev); // 🆕 Toggle blur
          break;
        case 't':
          e.preventDefault();
          setShowTranscript(prev => !prev); // 🆕 Toggle transcript
          break;
        case '<':
        case ',':
          e.preventDefault();
          changePlaybackRate(-0.25);
          break;
        case '>':
        case '.':
          e.preventDefault();
          changePlaybackRate(0.25);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getMediaElement, activeOriginalIndex, originalCues, currentTime]);

  // Hide controls after inactivity
  useEffect(() => {
    if (!isVideo || !isPlaying) {
      setShowControls(true);
      return;
    }

    const resetHideTimer = () => {
      setShowControls(true);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
      hideControlsTimeout.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', resetHideTimer);
    container.addEventListener('mouseenter', resetHideTimer);
    resetHideTimer();

    return () => {
      container.removeEventListener('mousemove', resetHideTimer);
      container.removeEventListener('mouseenter', resetHideTimer);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, [isVideo, isPlaying]);

  // Controls
  const togglePlay = useCallback(() => {
    const element = getMediaElement();
    if (!element) return;
    if (element.paused) {
      lastPausedCueRef.current = -1; // Reset for auto-pause
      element.play();
    } else {
      element.pause();
    }
  }, [getMediaElement]);

  // 🆕 Smart Seek - Go to previous cue
  const goToPrevCue = useCallback(() => {
    const element = getMediaElement();
    if (!element || originalCues.length === 0) return;
    
    let targetIndex = activeOriginalIndex - 1;
    if (targetIndex < 0) targetIndex = 0;
    
    // If we're more than 2 seconds into current cue, go to start of current cue instead
    const currentCue = originalCues[activeOriginalIndex];
    if (currentCue && currentTime - currentCue.start > 2) {
      targetIndex = activeOriginalIndex;
    }
    
    const targetCue = originalCues[targetIndex];
    if (targetCue) {
      element.currentTime = targetCue.start;
      lastPausedCueRef.current = -1;
    }
  }, [getMediaElement, originalCues, activeOriginalIndex, currentTime]);

  // 🆕 Smart Seek - Go to next cue
  const goToNextCue = useCallback(() => {
    const element = getMediaElement();
    if (!element || originalCues.length === 0) return;
    
    const targetIndex = Math.min(activeOriginalIndex + 1, originalCues.length - 1);
    const targetCue = originalCues[targetIndex];
    if (targetCue) {
      element.currentTime = targetCue.start;
      lastPausedCueRef.current = -1;
    }
  }, [getMediaElement, originalCues, activeOriginalIndex]);

  // 🆕 Jump to specific cue
  const jumpToCue = useCallback((index: number) => {
    const element = getMediaElement();
    if (!element || !originalCues[index]) return;
    
    element.currentTime = originalCues[index].start;
    lastPausedCueRef.current = -1;
    if (element.paused) {
      element.play();
    }
  }, [getMediaElement, originalCues]);

  // 🆕 Toggle A-B Loop
  const toggleLoop = useCallback(() => {
    if (isLooping) {
      setIsLooping(false);
      setLoopCueIndex(-1);
    } else if (activeOriginalIndex >= 0) {
      setIsLooping(true);
      setLoopCueIndex(activeOriginalIndex);
    }
  }, [isLooping, activeOriginalIndex]);

  // 🆕 Look up word meaning
  const lookupWord = useCallback(async (word: string) => {
    setIsLoadingMeaning(true);
    setWordMeaning(null);
    
    // Clean the word
    const cleanWord = word.toLowerCase().replace(/[^\w\s'-]/g, '');
    
    // Use free dictionary API
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
      if (response.ok) {
        const data = await response.json();
        const meanings = data[0]?.meanings || [];
        const definition = meanings[0]?.definitions?.[0]?.definition;
        const phonetic = data[0]?.phonetic || '';
        const partOfSpeech = meanings[0]?.partOfSpeech || '';
        
        let result = '';
        if (phonetic) result += `${phonetic}\n`;
        if (partOfSpeech) result += `[${partOfSpeech}] `;
        result += definition || 'Không tìm thấy nghĩa';
        
        setWordMeaning(result);
      } else {
        setWordMeaning('Không tìm thấy từ này trong từ điển');
      }
    } catch {
      setWordMeaning('Lỗi kết nối từ điển');
    }
    setIsLoadingMeaning(false);
  }, []);

  // 🆕 Handle word click
  const handleWordClick = useCallback((word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({ word, x: rect.left, y: rect.bottom });
    lookupWord(word);
    
    // Pause video when clicking word
    const element = getMediaElement();
    if (element && !element.paused) {
      element.pause();
    }
  }, [lookupWord, getMediaElement]);

  // Close word popup
  const closeWordPopup = useCallback(() => {
    setSelectedWord(null);
    setWordMeaning(null);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const element = getMediaElement();
    const target = e.currentTarget;
    if (!element) return;

    const rect = target.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    element.currentTime = pos * duration;
    setCurrentTime(pos * duration);
    lastPausedCueRef.current = -1;
  }, [duration, getMediaElement]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const element = getMediaElement();
    if (!element) return;
    element.volume = value[0];
    element.muted = value[0] === 0;
  }, [getMediaElement]);

  const adjustVolume = useCallback((delta: number) => {
    const element = getMediaElement();
    if (!element) return;
    const newVolume = Math.max(0, Math.min(1, element.volume + delta));
    element.volume = newVolume;
    element.muted = newVolume === 0;
  }, [getMediaElement]);

  const toggleMute = useCallback(() => {
    const element = getMediaElement();
    if (!element) return;
    element.muted = !element.muted;
  }, [getMediaElement]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  }, []);

  const changePlaybackRate = useCallback((delta: number) => {
    const element = getMediaElement();
    if (!element) return;
    const newRate = Math.max(0.5, Math.min(2, playbackRate + delta));
    element.playbackRate = newRate;
    setPlaybackRate(newRate);
  }, [playbackRate, getMediaElement]);

  const setRate = useCallback((rate: number) => {
    const element = getMediaElement();
    if (!element) return;
    element.playbackRate = rate;
    setPlaybackRate(rate);
  }, [getMediaElement]);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch (error) {
      console.error('PiP error:', error);
    }
  }, [isVideo]);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActiveCueText = (cues: VTTCue[], index: number): string => {
    if (index < 0 || index >= cues.length) return '';
    return cues[index].text;
  };

  // 🆕 Render interactive subtitle with clickable words
  const renderInteractiveSubtitle = (text: string, type: 'original' | 'translated') => {
    const words = text.split(/(\s+)/);
    const isBlurred = (type === 'original' && blurOriginal) || (type === 'translated' && blurTranslated);
    const isHovered = hoveredSubtitle === type;
    
    return (
      <span 
        className={cn(
          "transition-all duration-300 cursor-pointer",
          isBlurred && !isHovered && "blur-md select-none"
        )}
        onMouseEnter={() => {
          setHoveredSubtitle(type);
          // Pause when hovering subtitle
          const element = getMediaElement();
          if (element && !element.paused) {
            element.pause();
          }
        }}
        onMouseLeave={() => setHoveredSubtitle(null)}
      >
        {words.map((word, i) => {
          if (word.trim() === '') return <span key={i}>{word}</span>;
          return (
            <span
              key={i}
              className="hover:bg-white/30 hover:text-yellow-300 rounded px-0.5 transition-colors"
              onClick={(e) => handleWordClick(word, e)}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : Volume2;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex gap-4", showTranscript && "flex-col lg:flex-row")}>
        {/* Main Player */}
        <Card className={cn("overflow-hidden bg-black flex-1", showTranscript && "lg:flex-[2]")}>
          <CardContent className="p-0">
            <div 
              ref={containerRef}
              className={cn(
                "relative bg-black group select-none",
                isFullscreen && "fixed inset-0 z-50"
              )}
              onClick={closeWordPopup}
            >
              {/* Media Element */}
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="w-full aspect-video cursor-pointer"
                  onClick={togglePlay}
                  onDoubleClick={toggleFullscreen}
                  playsInline
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                  <audio ref={audioRef} src={mediaUrl} />
                  <div className="text-center cursor-pointer" onClick={togglePlay}>
                    <div className={cn(
                      "w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4",
                      "transition-all duration-300 hover:bg-white/20 hover:scale-105",
                      isPlaying && "animate-pulse"
                    )}>
                      {isLoading ? (
                        <Loader2 className="h-16 w-16 text-white animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-16 w-16 text-white" />
                      ) : (
                        <Play className="h-16 w-16 text-white ml-2" />
                      )}
                    </div>
                    <p className="text-white/60 text-sm">Trình Phát Âm Thanh</p>
                  </div>
                </div>
              )}

              {/* Loading Spinner */}
              {isLoading && isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <p className="text-white mb-4">Không thể tải media</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Thử lại</Button>
                  </div>
                </div>
              )}

              {/* Big Play Button */}
              {!isPlaying && !isLoading && isVideo && (
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                </div>
              )}

              {/* 🆕 Learning Mode Indicators */}
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                {isLooping && (
                  <Badge className="bg-yellow-500/90 text-black pointer-events-auto">
                    <Repeat className="h-3 w-3 mr-1" />
                    Lặp câu {loopCueIndex + 1}
                  </Badge>
                )}
                {autoPauseEnabled && (
                  <Badge className="bg-blue-500/90 pointer-events-auto">
                    <PauseCircle className="h-3 w-3 mr-1" />
                    Tự dừng
                  </Badge>
                )}
                {(blurOriginal || blurTranslated) && (
                  <Badge className="bg-purple-500/90 pointer-events-auto">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Thử thách
                  </Badge>
                )}
              </div>

              {/* 🆕 Word Meaning Popup */}
              {selectedWord && (
                <div 
                  className="fixed z-[100] bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[220px] max-w-[320px]"
                  style={{ 
                    left: Math.min(selectedWord.x, window.innerWidth - 340), 
                    top: selectedWord.y + 8 
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-yellow-400 text-lg">{selectedWord.word}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={closeWordPopup}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {isLoadingMeaning ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tra từ điển...
                    </div>
                  ) : (
                    <p className="text-sm text-gray-200 whitespace-pre-line">{wordMeaning}</p>
                  )}
                </div>
              )}

              {/* Subtitles Overlay */}
              <div className={cn(
                "absolute left-0 right-0 px-4 text-center transition-all",
                showControls ? "bottom-28" : "bottom-8"
              )}>
                {showOriginal && activeOriginalIndex >= 0 && (
                  <div className="mb-2 animate-in fade-in duration-200">
                    <span className={cn(
                      "inline-block bg-black/80 text-white px-4 py-2 rounded-lg font-medium shadow-xl backdrop-blur-sm",
                      subtitleSize
                    )}>
                      {renderInteractiveSubtitle(getActiveCueText(originalCues, activeOriginalIndex), 'original')}
                    </span>
                  </div>
                )}
                {showTranslated && activeTranslatedIndex >= 0 && (
                  <div className="animate-in fade-in duration-200">
                    <span className={cn(
                      "inline-block bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-xl",
                      subtitleSize
                    )}>
                      {renderInteractiveSubtitle(getActiveCueText(translatedCues, activeTranslatedIndex), 'translated')}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent",
                "transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                {/* Progress bar with sentence markers */}
                <div 
                  className="px-4 pt-6 pb-2 cursor-pointer group/progress"
                  onClick={handleProgressClick}
                >
                  <div className="relative h-1.5 group-hover/progress:h-2.5 transition-all bg-white/20 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${(buffered / duration) * 100}%` }} />
                    <div className="absolute h-full bg-primary rounded-full transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
                    {/* Sentence markers */}
                    {originalCues.map((cue, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-0.5 h-3 transition-colors",
                          i === activeOriginalIndex ? "bg-yellow-400" : "bg-white/40"
                        )}
                        style={{ left: `${(cue.start / duration) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="flex items-center gap-1">
                    {/* 🆕 Prev Sentence */}
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9" onClick={goToPrevCue}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger><TooltipContent>Câu trước (←)</TooltipContent></Tooltip>
                    
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </Button>
                    </TooltipTrigger><TooltipContent>{isPlaying ? 'Tạm dừng (K)' : 'Phát (K)'}</TooltipContent></Tooltip>
                    
                    {/* 🆕 Next Sentence */}
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9" onClick={goToNextCue}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger><TooltipContent>Câu sau (→)</TooltipContent></Tooltip>

                    {/* 🆕 Loop Button */}
                    <Tooltip><TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("text-white hover:bg-white/20 h-9 w-9", isLooping && "text-yellow-400 bg-yellow-400/20")} 
                        onClick={toggleLoop}
                      >
                        <Repeat className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger><TooltipContent>{isLooping ? 'Tắt lặp (R)' : 'Lặp câu này (R)'}</TooltipContent></Tooltip>

                    {/* Volume - Compact */}
                    <div className="flex items-center gap-1 ml-1 group/volume">
                      <Tooltip><TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={toggleMute}>
                          <VolumeIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Tắt tiếng (M)</TooltipContent></Tooltip>
                      <div className="w-0 overflow-hidden group-hover/volume:w-16 transition-all duration-200">
                        <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-16" />
                      </div>
                    </div>

                    <span className="text-white/80 text-sm ml-2 tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    
                    {/* Sentence counter */}
                    {originalCues.length > 0 && (
                      <span className="text-white/60 text-xs ml-2">
                        Câu {activeOriginalIndex + 1}/{originalCues.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* 🆕 Transcript Toggle */}
                    <Tooltip><TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("text-white hover:bg-white/20 h-9 w-9", showTranscript && "text-primary bg-primary/20")}
                        onClick={() => setShowTranscript(!showTranscript)}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger><TooltipContent>Kịch bản (T)</TooltipContent></Tooltip>

                    {/* 🆕 Learning Mode Settings */}
                    <DropdownMenu>
                      <Tooltip><TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "text-white hover:bg-white/20 h-9 w-9",
                              (autoPauseEnabled || blurOriginal || blurTranslated) && "text-purple-400 bg-purple-400/20"
                            )}
                          >
                            <GraduationCap className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger><TooltipContent>Chế độ học</TooltipContent></Tooltip>
                      <DropdownMenuContent align="end" className="w-72">
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          Chế Độ Học Tập
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <div className="p-3 space-y-4">
                          {/* Auto-pause */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Tự dừng sau mỗi câu</label>
                              <p className="text-xs text-muted-foreground">Ngấm nghĩa trước khi tiếp tục</p>
                            </div>
                            <Switch checked={autoPauseEnabled} onCheckedChange={setAutoPauseEnabled} />
                          </div>
                          
                          {/* Blur original */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Mờ phụ đề gốc</label>
                              <p className="text-xs text-muted-foreground">Thử nghe hiểu trước</p>
                            </div>
                            <Switch checked={blurOriginal} onCheckedChange={setBlurOriginal} />
                          </div>
                          
                          {/* Blur translated */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Mờ phụ đề dịch</label>
                              <p className="text-xs text-muted-foreground">Tự đoán nghĩa trước</p>
                            </div>
                            <Switch checked={blurTranslated} onCheckedChange={setBlurTranslated} />
                          </div>
                        </div>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Kích thước phụ đề</DropdownMenuLabel>
                        {SUBTITLE_SIZES.map((size) => (
                          <DropdownMenuItem key={size.value} onClick={() => setSubtitleSize(size.value)}>
                            <span className={cn("mr-2", subtitleSize === size.value && "text-primary")}>
                              {subtitleSize === size.value ? '✓' : '○'}
                            </span>
                            {size.label}
                          </DropdownMenuItem>
                        ))}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Tốc độ phát: {playbackRate}x</DropdownMenuLabel>
                        <div className="px-3 py-2">
                          <Slider 
                            value={[playbackRate]} 
                            min={0.5} 
                            max={2} 
                            step={0.25} 
                            onValueChange={([v]) => setRate(v)} 
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0.5x</span>
                            <span>1x</span>
                            <span>2x</span>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Shortcuts Help */}
                    <DropdownMenu>
                      <Tooltip><TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger><TooltipContent>Phím tắt</TooltipContent></Tooltip>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Phím Tắt</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2 text-xs space-y-2">
                          <div className="font-medium text-muted-foreground mb-2">Điều khiển cơ bản</div>
                          <div className="flex justify-between"><span>Phát/Dừng</span><kbd className="bg-muted px-1.5 py-0.5 rounded">Space</kbd></div>
                          <div className="flex justify-between"><span>Toàn màn hình</span><kbd className="bg-muted px-1.5 py-0.5 rounded">F</kbd></div>
                          <div className="flex justify-between"><span>Tắt tiếng</span><kbd className="bg-muted px-1.5 py-0.5 rounded">M</kbd></div>
                          <div className="flex justify-between"><span>Âm lượng</span><kbd className="bg-muted px-1.5 py-0.5 rounded">↑ ↓</kbd></div>
                          
                          <div className="font-medium text-muted-foreground mt-3 mb-2">Điều hướng học</div>
                          <div className="flex justify-between"><span>Câu trước/sau</span><kbd className="bg-muted px-1.5 py-0.5 rounded">← →</kbd></div>
                          <div className="flex justify-between"><span>Lặp câu (A-B Loop)</span><kbd className="bg-muted px-1.5 py-0.5 rounded">R</kbd></div>
                          <div className="flex justify-between"><span>Tự dừng mỗi câu</span><kbd className="bg-muted px-1.5 py-0.5 rounded">A</kbd></div>
                          <div className="flex justify-between"><span>Mờ phụ đề dịch</span><kbd className="bg-muted px-1.5 py-0.5 rounded">B</kbd></div>
                          <div className="flex justify-between"><span>Hiện kịch bản</span><kbd className="bg-muted px-1.5 py-0.5 rounded">T</kbd></div>
                          <div className="flex justify-between"><span>Tốc độ phát</span><kbd className="bg-muted px-1.5 py-0.5 rounded">&lt; &gt;</kbd></div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* PiP */}
                    {isVideo && typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                      <Tooltip><TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9" onClick={togglePiP}>
                          <PictureInPicture2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger><TooltipContent>Hình trong hình</TooltipContent></Tooltip>
                    )}

                    {/* Fullscreen */}
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger><TooltipContent>Toàn màn hình (F)</TooltipContent></Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🆕 Transcript Sidebar */}
        {showTranscript && (
          <Card className={cn("flex-1 lg:flex-[1] lg:max-w-md", isFullscreen && "hidden")}>
            <CardContent className="p-0">
              <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Kịch Bản</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {activeOriginalIndex + 1} / {originalCues.length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 lg:hidden"
                    onClick={() => setShowTranscript(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div 
                ref={transcriptRef}
                className="h-[300px] lg:h-[calc(100vh-280px)] overflow-y-auto"
              >
                {originalCues.map((cue, index) => {
                  const translatedCue = translatedCues[index];
                  const isActive = index === activeOriginalIndex;
                  const isLoopTarget = index === loopCueIndex && isLooping;
                  
                  return (
                    <div
                      key={cue.index}
                      data-cue-index={index}
                      className={cn(
                        "px-4 py-3 cursor-pointer transition-all border-l-2",
                        isActive 
                          ? "bg-primary/10 border-l-primary" 
                          : "hover:bg-muted/50 border-l-transparent",
                        isLoopTarget && "ring-1 ring-inset ring-yellow-500 bg-yellow-500/10"
                      )}
                      onClick={() => jumpToCue(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "text-xs tabular-nums px-1.5 py-0.5 rounded",
                            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {formatTime(cue.start)}
                          </span>
                          {isLoopTarget && (
                            <Repeat className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className={cn(
                            "text-sm leading-relaxed",
                            isActive && "font-medium"
                          )}>
                            {cue.text}
                          </p>
                          {translatedCue && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {translatedCue.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {originalCues.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <List className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Chưa có phụ đề</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
