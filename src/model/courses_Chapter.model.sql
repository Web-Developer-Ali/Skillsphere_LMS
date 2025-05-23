CREATE TABLE "Courses_Chapters" (
    "ChapterID" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(1000) NOT NULL,
    "Video" VARCHAR(500),
    "IsFreePreview" BOOLEAN DEFAULT FALSE,
    "CourseID" INT NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "TranscodingStatus" VARCHAR(50) DEFAULT 'Pending',
    "TranscodingError" VARCHAR(1000),
    "ChapterCount" INT NOT NULL,
    "Thumbnail" VARCHAR(500),
    "Duration" INT,
    CONSTRAINT "FK_Chapters_CourseID" FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID") ON DELETE CASCADE
);
-- Lookup by course
CREATE INDEX "IDX_Courses_Chapters_CourseID" 
ON "Courses_Chapters"("CourseID");

-- Lookup by free preview flag
CREATE INDEX "IDX_Courses_Chapters_IsFreePreview" 
ON "Courses_Chapters"("IsFreePreview");

-- Lookup by transcoding status
CREATE INDEX "IDX_Courses_Chapters_TranscodingStatus" 
ON "Courses_Chapters"("TranscodingStatus");