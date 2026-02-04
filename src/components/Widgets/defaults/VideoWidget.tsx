import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WebOSAPI } from '../../../types';

// Same default as the YouTube app (youtube.ts) – embed format
const DEFAULT_EMBED_URL = 'https://www.youtube.com/embed/jfKfPfyJRdk';

/** Same logic as WebViewWindow.convertToEmbedUrl – YouTube/Vimeo → embed for iframe */
function convertToEmbedUrl(url: string): string {
  const trimmed = url.trim();
  // YouTube watch -> embed
  const youtubeWatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeWatch) return `https://www.youtube.com/embed/${youtubeWatch[1]}`;
  // YouTube Shorts -> embed
  const youtubeShorts = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (youtubeShorts) return `https://www.youtube.com/embed/${youtubeShorts[1]}`;
  // Already embed
  if (/youtube\.com\/embed\//i.test(trimmed)) return trimmed;
  // Vimeo
  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return trimmed;
}

function isYouTubeOrVimeoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

/** Append params to hide YouTube UI (controls bar) for a cleaner experience */
function youTubeEmbedUrlWithParams(embedUrl: string): string {
  if (!/youtube\.com\/embed\//i.test(embedUrl)) return embedUrl;
  const sep = embedUrl.includes('?') ? '&' : '?';
  return `${embedUrl}${sep}controls=0&modestbranding=1&rel=0`;
}

function isDirectVideoUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(path);
  } catch {
    return false;
  }
}

function extractVideoUrl(text: string): string | null {
  const urlMatch = text.match(
    /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]+|https?:\/\/(?:www\.)?vimeo\.com\/\d+|https?:\/\/[^\s]+\.(?:mp4|webm|ogg|mov|m4v)(?:\?[^\s]*)?/i
  );
  return urlMatch ? urlMatch[0].trim() : null;
}

interface VideoWidgetProps {
  api: WebOSAPI;
  instanceId?: string;
}

type VideoKind = 'youtube' | 'direct' | null;

export const VideoWidget: React.FC<VideoWidgetProps> = ({ api, instanceId }) => {
  const stateId = instanceId || 'video-widget';
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [src, setSrc] = useState<string | null>(DEFAULT_EMBED_URL);
  const [kind, setKind] = useState<VideoKind>('youtube');
  const [hover, setHover] = useState(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [isPiPActive, setIsPiPActive] = useState(false);

  const applyUrl = useCallback((raw: string) => {
    const url = raw.trim();
    if (!url) return;
    if (isYouTubeOrVimeoUrl(url)) {
      setSrc(convertToEmbedUrl(url));
      setKind('youtube');
      return;
    }
    if (isDirectVideoUrl(url) || url.startsWith('http')) {
      setSrc(url);
      setKind('direct');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.loadWidgetState(stateId).then((saved: unknown) => {
      if (cancelled) return;
      const o = saved as { src?: string; kind?: VideoKind } | null;
      if (o?.src) {
        setSrc(o.src);
        setKind(o.kind ?? (isYouTubeOrVimeoUrl(o.src) ? 'youtube' : 'direct'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [api, stateId]);

  useEffect(() => {
    if (!src || !kind) return;
    api.saveWidgetState(stateId, { src, kind }).catch(() => {});
  }, [api, stateId, src, kind]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target)) return;
      const text = e.clipboardData?.getData('text/plain') ?? '';
      const url = extractVideoUrl(text) ?? text;
      if (url) {
        e.preventDefault();
        applyUrl(url);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [applyUrl]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const text = e.dataTransfer.getData('text/plain');
      const files = e.dataTransfer.files;
      if (text) {
        const url = extractVideoUrl(text) ?? text;
        applyUrl(url);
        return;
      }
      if (files?.length) {
        const file = Array.from(files).find((f) =>
          /\.(mp4|webm|ogg|mov|m4v)$/i.test(f.name)
        );
        if (file) {
          setSrc(URL.createObjectURL(file));
          setKind('direct');
        }
      }
    },
    [applyUrl]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
  }, []);

  const play = () => {
    videoRef.current?.play();
    setPaused(false);
  };
  const pause = () => {
    videoRef.current?.pause();
    setPaused(true);
  };
  const togglePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };
  const seek = (delta: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (v) {
      v.muted = !v.muted;
      setMuted(v.muted);
    }
  };

  const togglePiP = async () => {
    if (!('pictureInPictureEnabled' in document)) {
      return;
    }
    if (!document.pictureInPictureEnabled) {
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement === v) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        await v.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v || kind !== 'direct') return;
    const onEnter = () => setIsPiPActive(true);
    const onLeave = () => setIsPiPActive(false);
    v.addEventListener('enterpictureinpicture', onEnter);
    v.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      v.removeEventListener('enterpictureinpicture', onEnter);
      v.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [kind, src]);

  const clearVideo = () => {
    if (src && kind === 'direct' && src.startsWith('blob:')) URL.revokeObjectURL(src);
    setSrc(null);
    setKind(null);
  };

  const showPlaceholder = !src;

  return (
    <div
      ref={containerRef}
      className="video-widget-root w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {showPlaceholder && (
        <div className="video-widget-placeholder">
          <span className="video-widget-placeholder-icon">▶</span>
          <p>Drag a video URL here</p>
          <p className="video-widget-placeholder-sub">or paste a link (Ctrl+V)</p>
          <p className="video-widget-placeholder-hint">YouTube, MP4, WebM…</p>
        </div>
      )}

      {/* Same structure as WebViewWindow content: flex-1 relative wrapper then iframe w-full h-full */}
      {src && kind === 'youtube' && (
        <div className="flex-1 relative min-h-0">
          <iframe
            key={src}
            src={youTubeEmbedUrlWithParams(src)}
            className="w-full h-full border-none"
            title="Video"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {src && kind === 'direct' && (
        <div className="flex-1 relative min-h-0">
          <video
            ref={videoRef}
            className="video-widget-video"
            src={src}
            playsInline
            onLoadedMetadata={() => setMuted(!!videoRef.current?.muted)}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          />
          {hover && (
            <div className="video-widget-controls">
              <button type="button" onClick={togglePlayPause} title="Play / Pause">
                {paused ? '▶' : '⏸'}
              </button>
              <button type="button" onClick={() => seek(-10)} title="-10 s">−10</button>
              <button type="button" onClick={() => seek(10)} title="+10 s">+10</button>
              <button type="button" onClick={toggleMute} title="Mute">
                {muted ? '🔇' : '🔊'}
              </button>
              {'pictureInPictureEnabled' in document && document.pictureInPictureEnabled && (
                <button type="button" onClick={togglePiP} title={isPiPActive ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}>
                  {isPiPActive ? '⛶' : '⊡'}
                </button>
              )}
              <button type="button" onClick={clearVideo} className="video-widget-controls-close" title="Close video">
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {src && kind === 'youtube' && hover && (
        <div className="video-widget-controls video-widget-controls-youtube">
          <button type="button" onClick={clearVideo} title="Close video">
            ✕ Close
          </button>
        </div>
      )}

      <style>{`
        .video-widget-root {
          position: relative;
          background: #0f172a;
          border-radius: 8px;
          box-sizing: border-box;
        }
        .video-widget-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 13px;
          padding: 16px;
          text-align: center;
          border: 2px dashed #334155;
          border-radius: 8px;
          margin: 4px;
        }
        .video-widget-placeholder-icon {
          font-size: 32px;
          opacity: 0.6;
        }
        .video-widget-placeholder-sub { font-size: 12px; opacity: 0.9; }
        .video-widget-placeholder-hint { font-size: 11px; opacity: 0.7; }
        .video-widget-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          object-fit: contain;
          background: #000;
        }
        .video-widget-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: linear-gradient(transparent, rgba(0,0,0,0.85));
          color: #fff;
          font-size: 12px;
        }
        .video-widget-controls button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: inherit;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        .video-widget-controls button:hover {
          background: rgba(255,255,255,0.35);
        }
        .video-widget-controls-close { margin-left: auto; }
        .video-widget-controls-youtube { justify-content: flex-end; }
      `}</style>
    </div>
  );
};
