CREATE SEQUENCE "ChapterFiles_FileID_Seq" START 1;

CREATE TABLE "ChapterFiles" (
    "FileID" INT DEFAULT nextval('"ChapterFiles_FileID_Seq"') PRIMARY KEY,
    "ChapterID" INT NOT NULL,
    "BlobName" VARCHAR(255) NOT NULL,
    "ContainerName" VARCHAR(255) NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ChapterID") REFERENCES "Courses_Chapters"("ChapterID")
);