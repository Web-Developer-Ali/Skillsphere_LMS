CREATE TABLE Courses_Chapters (
    ChapterID INT IDENTITY(1,1) PRIMARY KEY,      
    Title NVARCHAR(255) NOT NULL,                
    Description NVARCHAR(1000) NOT NULL,         -- Optimized for typical usage
    Video NVARCHAR(500) NULL,                    -- Long URL support
    IsFreePreview BIT DEFAULT 0,                 
    CourseID INT NOT NULL,                       
    CreatedAt DATETIME DEFAULT GETDATE(),        
    UpdatedAt DATETIME DEFAULT GETDATE(),        

    -- columns for transcoding status and errors
    TranscodingStatus NVARCHAR(50) DEFAULT 'Pending',  -- Tracks transcoding state (e.g., 'Pending', 'Processing', 'Failed', 'Completed')
    TranscodingError NVARCHAR(1000) NULL,              -- Stores error messages when transcoding fails

    -- adding ChapterCount field
    ChapterCount INT NOT NULL,                  -- Sequential count for chapters in a course

    -- Foreign key constraint
    CONSTRAINT FK_Chapters_CourseID FOREIGN KEY (CourseID) REFERENCES Courses(CourseID) ON DELETE CASCADE
);

-- Indexes for faster lookups
CREATE INDEX IDX_Courses_Chapters_CourseID ON Courses_Chapters(CourseID);
CREATE INDEX IDX_Courses_Chapters_IsFreePreview ON Courses_Chapters(IsFreePreview);
CREATE INDEX IDX_Courses_Chapters_TranscodingStatus ON Courses_Chapters(TranscodingStatus);  -- Index for quick status filtering
