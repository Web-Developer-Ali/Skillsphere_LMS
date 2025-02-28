CREATE TABLE ChapterFiles (
    FileID INT IDENTITY(1,1) PRIMARY KEY,
    ChapterID INT NOT NULL,
    BlobName NVARCHAR(255) NOT NULL,
    ContainerName NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ChapterID) REFERENCES Courses_Chapters(ChapterID)
);