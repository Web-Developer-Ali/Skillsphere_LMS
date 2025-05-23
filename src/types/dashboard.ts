export interface DashboardData {
    overview: {
      totalStudents: number;
      totalCourses: number;
      totalRevenue: number;
      averageRating: number;
    };
    students: Array<{
      name: string;
      avatar: string;
      courseName: string;
    }>;
    revenue: {
      revenueOverTime: Array<{ month: string; revenue: number }>;
      revenueByCourse: Array<{ name: string; revenue: number }>;
    };
    courses: Array<{
      name: string;
      students: number;
      revenue: number;
      rating: number;
    }>;
  }

  export interface Course {
    CourseID: number;
    Title: string;
    Category: string;
    DifficultyLevel: string;
    Rating?: number | string;
    Fees?: number | string; 
    EnrollmentDate?: string;
    Progress?: number;
    ThumbnailPublicID?: string;
  }

  export interface DashboardResponse {
    enrolledCourseCount: number;
    totalLearningHours: number;
    recentEnrolledCourses: {
      CourseID: number;
      Title: string;
      ThumbnailPublicID: string;
      EnrollmentDate: string;
      Progress: number;
    }[];
    certificationCount: number;
    recommendedCourses?: {
      CourseID: number;
      Title: string;
      Description: string;
      Category: string;
      DifficultyLevel: string;
      Skills: string;
      Fees: number;
      Rating: number;
      ThumbnailPublicID: string;
    }[];
    recommendationsBasedOn?: string;
  }