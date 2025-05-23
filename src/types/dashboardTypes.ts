export interface Course {
    CourseID: number
    Title: string
    Category: string
    DifficultyLevel: string
    CompletionStatus: boolean
    EnrollmentDate: string
    ThumbnailPublicID: string
    Rating?: number
    Fees: number
    Description?: string
  }
  
  export interface UserInfo {
    enrolledCourseCount: number
    totalLearningHours: number
    recentEnrolledCourses: Course[]
  }
  
  export interface Certification {
    certificationCount: number
  }
  
  export interface ApiResponse<T> {
    data?: T
    error?: string
  }