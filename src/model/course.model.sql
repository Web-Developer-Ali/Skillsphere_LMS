CREATE TABLE Courses (
    CourseID INT IDENTITY(1,1) PRIMARY KEY,       
    Title NVARCHAR(255) NOT NULL,                
    Description NVARCHAR(MAX) NOT NULL,          
    Category NVARCHAR(100) NOT NULL,             
    DifficultyLevel NVARCHAR(20) NOT NULL CHECK (DifficultyLevel IN ('Beginner', 'Intermediate', 'Advanced')), 
    Skills NVARCHAR(MAX) NOT NULL,               
    Status NVARCHAR(20) DEFAULT 'draft' CHECK (Status IN ('draft', 'published', 'archived')),
    Fees DECIMAL(10, 2) NOT NULL CHECK (Fees >= 0), 
    InstructorID INT NOT NULL, -- Reference to UserID in Users table
    Rating DECIMAL(2, 1) DEFAULT 0 CHECK (Rating BETWEEN 0 AND 5), 
    Students NVARCHAR(MAX),                     
    CreatedAt DATETIME DEFAULT GETDATE(),        
    ThumbnailPublicID NVARCHAR(255),
    -- Foreign key for instructors referencing the Users table
    CONSTRAINT FK_Courses_Instructors FOREIGN KEY (InstructorID) REFERENCES Users(UserID) 
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IDX_Courses_Category ON Courses(Category);
CREATE INDEX IDX_Courses_InstructorID ON Courses(InstructorID);
