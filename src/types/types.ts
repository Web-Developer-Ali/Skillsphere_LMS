import { VideoJsPlayer } from "video.js"

export type VideoJSPlayer = VideoJsPlayer & {
  isDisposed?: () => boolean
  tech?: () => {
    el: () => HTMLVideoElement
  }
}

export interface VideoPlayerProps {
  videoUrl: string
  onReady?: (player: VideoJSPlayer) => void
}

export interface PlayerControls {
  togglePlay: () => void
  toggleMute: () => void
  handleVolumeChange: (value: number[]) => void
  handleSeek: (value: number[]) => void
  toggleFullscreen: () => void
  skipForward: () => void
  skipBackward: () => void
  formatTime: (seconds: number) => string
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  playerRef: React.RefObject<VideoJSPlayer | null>
}