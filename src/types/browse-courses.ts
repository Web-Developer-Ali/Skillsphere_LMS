export type Course = {
    CourseID: number;
    Title: string;
    InstructorName: string;
    Rating: number;
    Fees: number;
    ThumbnailPublicID: string;
    sasURL: string;
    Category: string;
    DifficultyLevel: string;
    DurationWeeks: number;
    Students: number;
    Description: string;
    StudentCount: string;
    ChapterCount: string;
  };

  export interface FilterState {
    levels: string[];
    durations: string[];
    priceRange: number;
    ratings: number[];
  }
  
 export type ApiResponse = {
    courses: Course[];
    totalCount: number;
    page: number;
    totalPages: number;
    availableCategories: [];
  };
  
 export type SasResponse = {
    sasURL: string;
  };