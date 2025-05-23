interface Chapter {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    isFree: boolean;
    position: number;
    duration: string;
    thumbnailUrl: string;
    isCompleted?: boolean;
  }
  
  export interface Course {
    id: string
    title: string
    description: string
    instructor: string
    videoUrl: string
    thumbnailUrl: string
    duration: string
    level: string
    rating: number
    studentsEnrolled: number
    skills: string[]
    content: {
      id: string
      title: string
      isCompleted: boolean
    }[]
    totalChapters: number
    isEnrolled: boolean
  }
  
  export interface VideoPlayerHandle {
    play: () => void
    pause: () => void
    seek: (time: number) => void
    getCurrentTime: () => number
    getDuration: () => number
    dispose: () => void
  }
  
  export interface VideoPlayerProps {
    src: string
    poster?: string
    title?: string
    autoPlay?: boolean
  }
  
  