export interface Video {
  chapterId: number
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  isFreePreview: boolean
  isCompleted: boolean
  createdAt: string
}

export interface Course {
  courseId: number
  title: string
  instructorName: string
  totalVideos: number
  completedVideos: number
  chapters: Video[]
  isEnrolled: boolean
}

export interface CoursePlayerProps {
  courseId: string | null
}

export interface CoursePlayerHeaderProps {
  title: string
  instructorName: string
  progressPercentage: number
  onToggleSidebar: () => void
  sidebarOpen: boolean
  isMobile: boolean
}

export interface CoursePlayerContentProps {
  courseId:Number
  currentVideo: Video | null
  instructorName: string
  chapters: Video[]
  onMarkComplete: (chapterId: number) => void
}

export interface CoursePlayerSidebarProps {
  title: string
  chapters: Video[]
  currentVideoId: number | null
  progressPercentage: number
  totalVideos: number
  completedVideos: number
  isMobile: boolean
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onSelectVideo: (video: Video) => void
}

export interface ChapterItemProps {
  chapter: Video
  index: number
  isActive: boolean
  onSelect: () => void
}

export interface VideoDetailsProps {
  video: Video
  instructorName: string
  chapters: Video[]
  onRateCourse: (rating: number) => Promise<void>
  courseId: Number
}