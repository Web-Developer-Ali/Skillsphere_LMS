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