CREATE TABLE "Courses" (
    "CourseID" SERIAL PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Description" TEXT NOT NULL,
    "Category" VARCHAR(100) NOT NULL,
    "DifficultyLevel" VARCHAR(20) NOT NULL CHECK ("DifficultyLevel" IN ('Beginner', 'Intermediate', 'Advanced')),
    "Skills" TEXT NOT NULL,
    "Status" VARCHAR(20) DEFAULT 'draft' CHECK ("Status" IN ('draft', 'published', 'archived')),
    "Fees" DECIMAL(10, 2) NOT NULL CHECK ("Fees" >= 0),
    "InstructorID" INT NOT NULL,
    "RatingID" INT, -- Added field to store reference to ratings
    "Rating" DECIMAL(2, 1) DEFAULT 0 CHECK ("Rating" BETWEEN 0 AND 5),
    "Students" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ThumbnailPublicID" VARCHAR(255),
    FOREIGN KEY ("InstructorID") REFERENCES "Users"("UserID") ON DELETE CASCADE
);


CREATE INDEX "IDX_Courses_Category" ON "Courses"("Category");
CREATE INDEX "IDX_Courses_InstructorID" ON "Courses"("InstructorID");;
CREATE INDEX IDX_Courses_Covering_Dashboard 
ON "Courses"("CourseID", "Title", "ThumbnailPublicID");
