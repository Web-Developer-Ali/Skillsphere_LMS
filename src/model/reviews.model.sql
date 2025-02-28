CREATE TABLE CourseReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,       
    CourseID INT NOT NULL,                       
    UserID INT NOT NULL,                         
    Rating TINYINT CHECK (Rating BETWEEN 1 AND 5) NOT NULL, 
    ReviewText NVARCHAR(MAX) NOT NULL,           
    CreatedAt DATETIME DEFAULT GETDATE(),        
    UpdatedAt DATETIME DEFAULT GETDATE(),         

    -- Foreign key constraints
    CONSTRAINT FK_CourseReviews_CourseID FOREIGN KEY (CourseID) REFERENCES Courses(CourseID) ON DELETE CASCADE,
    CONSTRAINT FK_CourseReviews_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE NO ACTION  -- Modify this line
);
