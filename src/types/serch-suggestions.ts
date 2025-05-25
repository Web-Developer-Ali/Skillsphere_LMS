export type SearchResponseData = {
    success: boolean;
    data: {
      coursesTitles: string[];
      categories: string[];
    };
    meta: {
      query: string;
      resultsCount: {
        titles: number;
        categories: number;
      };
    };
  };