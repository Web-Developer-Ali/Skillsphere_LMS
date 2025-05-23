CREATE TABLE "CourseReviews" (
    "ReviewID" SERIAL PRIMARY KEY,
    "CourseID" INT NOT NULL,
    "UserID" INT NOT NULL,
    "Rating" SMALLINT CHECK ("Rating" BETWEEN 1 AND 5) NOT NULL,
    "ReviewText" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT "FK_CourseReviews_CourseID" 
        FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID") ON DELETE CASCADE,
    CONSTRAINT "FK_CourseReviews_UserID" 
        FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE NO ACTION
);