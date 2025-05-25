"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
  SkipForward,
  SkipBack,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HLSPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  mutedAutoPlay?: boolean;
  className?: string;
  onVideoComplete?: () => void;
}

export default function HLSPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  mutedAutoPlay = true,
  className,
  onVideoComplete,
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlayOverlay, setShowPlayOverlay] = useState(autoPlay);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Initialize HLS
// Initialize HLS
useEffect(() => {
  let hls: Hls | null = null;
  const video = videoRef.current; // Copy the ref to a local variable

  const initPlayer = async () => {
    if (!video) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch and modify the master playlist
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`);
      }

      const masterPlaylist = await response.text();
      // Extract the base URL from the video URL
      const containerBaseUrl =
        src.match(/(.*\/chaperters-videos-transcoded\/)/)?.[0] ||
        src.substring(0, src.lastIndexOf("/") + 1);

      // Modify the playlist to ensure all paths are absolute
      const lines = masterPlaylist.split("\n");
      const modifiedLines = lines.map((line) => {
        if (
          !line.startsWith("#") &&
          (line.includes(".m3u8") || line.includes(".ts"))
        ) {
          // If the line is not already an absolute URL, prepend the base URL
          if (!line.startsWith("http")) {
            return containerBaseUrl + line;
          }
        }
        return line;
      });

      const modifiedPlaylist = modifiedLines.join("\n");
      const blob = new Blob([modifiedPlaylist], {
        type: "application/x-mpegURL",
      });
      const modifiedPlaylistUrl = URL.createObjectURL(blob);

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(modifiedPlaylistUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoPlay) {
            // Mute the video if mutedAutoPlay is true
            if (mutedAutoPlay) {
              video.muted = true;
              setIsMuted(true);
            }
            
            video.play().catch((err) => {
              console.error("Autoplay failed:", err);
              setShowPlayOverlay(true);
              setIsPlaying(false);
            });
            setIsPlaying(true);
            setShowPlayOverlay(false);
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error, trying to recover...");
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error, trying to recover...");
                hls?.recoverMediaError();
                break;
              default:
                console.error("Unrecoverable error:", data);
                hls?.destroy();
                setError("Failed to load video stream");
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = modifiedPlaylistUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          if (autoPlay) {
            if (mutedAutoPlay) {
              video.muted = true;
              setIsMuted(true);
            }
            video.play().catch((err) => {
              console.error("Autoplay failed:", err);
              setShowPlayOverlay(true);
              setIsPlaying(false);
            });
            setIsPlaying(true);
            setShowPlayOverlay(false);
          }
        });
      } else {
        setError("HLS is not supported in this browser");
      }
    } catch (err) {
      console.error("Error initializing player:", err);
      setError(err instanceof Error ? err.message : "Failed to load video");
      setIsLoading(false);
    }
  };

  initPlayer();

  return () => {
    if (hls) {
      hls.destroy();
    }
    // Clean up object URLs to avoid memory leaks
    if (video?.src && video.src.startsWith("blob:")) {
      URL.revokeObjectURL(video.src);
    }
  };
}, [src, autoPlay, mutedAutoPlay]);

  // Handle time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setShowPlayOverlay(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      if (onVideoComplete) {
        onVideoComplete();
      }
    };

    const handleError = () => {
      setError("Error playing video");
      setIsLoading(false);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [onVideoComplete]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!isHovering && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isHovering, isPlaying]);

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Play failed:", err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Set volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  // Seek to position
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number.parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Skip forward 10 seconds
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.currentTime + 10,
        duration
      );
    }
  };

  // Skip backward 10 seconds
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        videoRef.current.currentTime - 10,
        0
      );
    }
  };

  // Set playback rate
  const setSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  // Retry loading the video
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);

    // Re-initialize the player
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-black aspect-video group",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => {
        setIsHovering(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) setIsHovering(false);
        }, 3000);
      }}
    >
      {/* Video Title */}
      {title && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          <h2 className="text-white font-medium truncate">{title}</h2>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 p-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md max-w-md shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry();
                    }}
                    className="ml-2 text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none underline"
                  >
                    Retry
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Play Overlay (shown when autoplay fails or video is paused) */}
      {showPlayOverlay && !isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
          <button 
            onClick={() => {
              togglePlay();
              setShowPlayOverlay(false);
            }}
            className="bg-black/30 rounded-full p-5 focus:outline-none"
            aria-label="Play"
          >
            <Play className="w-10 h-10 text-white fill-white" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-2 transition-opacity duration-300 z-20",
          showControls ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="flex items-center mb-2 group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer group-hover:h-2.5 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
            style={{
              background: `linear-gradient(to right, #ef4444 ${
                (currentTime / (duration || 1)) * 100
              }%, rgba(255, 255, 255, 0.3) ${
                (currentTime / (duration || 1)) * 100
              }%)`,
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-red-500 focus:outline-none transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Skip Buttons */}
            <button
              onClick={skipBackward}
              className="text-white hover:text-red-500 focus:outline-none transition-colors hidden sm:block"
              aria-label="Skip backward 10 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={skipForward}
              className="text-white hover:text-red-500 focus:outline-none transition-colors hidden sm:block"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 relative">
              <button
                onClick={toggleMute}
                className="text-white hover:text-red-500 focus:outline-none transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                style={{
                  background: `linear-gradient(to right, white ${
                    (isMuted ? 0 : volume) * 100
                  }%, rgba(255, 255, 255, 0.3) ${
                    (isMuted ? 0 : volume) * 100
                  }%)`,
                }}
              />
            </div>

            {/* Time Display */}
            <div className="text-white text-sm">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Playback Speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-white hover:text-red-500 focus:outline-none transition-colors hidden sm:flex items-center"
                  aria-label="Playback speed"
                >
                  <Clock className="w-5 h-5" />
                  <span className="ml-1 text-xs">
                    {playbackRate === 1 ? "Normal" : `${playbackRate}x`}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/90 border-gray-700 text-white"
              >
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => setSpeed(rate)}
                    className="hover:bg-gray-700 cursor-pointer"
                  >
                    {rate === 1 ? "Normal" : `${rate}x`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Button (placeholder) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-white hover:text-red-500 focus:outline-none transition-colors hidden sm:block"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/90 border-gray-700 text-white"
              >
                <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">
                  Quality
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">
                  Captions
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-red-500 focus:outline-none transition-colors"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}