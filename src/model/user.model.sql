CREATE TABLE Users (
  UserID INT IDENTITY(1,1) PRIMARY KEY,       
  UserType NVARCHAR(50) CHECK (UserType IN ('Student', 'Instructor')) NOT NULL, 
  FullName NVARCHAR(255) NOT NULL,           
  Email NVARCHAR(255) NOT NULL UNIQUE,       
  Password VARBINARY(500),                    
  VerifyCode NVARCHAR(255),                  
  ExpireVerifyCode DATETIME,                 
  IsVerified BIT DEFAULT 0,                  
  OnboardComplete BIT DEFAULT 0,             
  AvatarSecureURL NVARCHAR(255),                         
  Bio NVARCHAR(MAX),                         
  Expertise NVARCHAR(255),                   
  Age INT,                                   
  DesireRole NVARCHAR(255),                  
  CreatedAt DATETIME DEFAULT GETDATE(),      
  UpdatedAt DATETIME DEFAULT GETDATE()       
);

CREATE TRIGGER trg_Users_UpdateTimestamp
ON Users
AFTER UPDATE
AS
BEGIN
    UPDATE Users
    SET UpdatedAt = GETDATE()
    WHERE UserID IN (SELECT DISTINCT UserID FROM Inserted);
END;

CREATE TABLE EnrolledCourses (
  UserID INT NOT NULL,                       
  CourseID INT NOT NULL,                     
  FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
  FOREIGN KEY (CourseID) REFERENCES Courses(CourseID) ON DELETE NO ACTION,
  PRIMARY KEY (UserID, CourseID)              
);


CREATE TABLE InstructorCourses (
  UserID INT NOT NULL,                       
  CourseID INT NOT NULL,                     
  FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
  FOREIGN KEY (CourseID) REFERENCES Courses(CourseID) ON DELETE NO ACTION,
  PRIMARY KEY (UserID, CourseID)              
);

