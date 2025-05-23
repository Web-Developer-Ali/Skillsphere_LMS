CREATE TABLE "Users" (
    "UserID" SERIAL PRIMARY KEY,
    "UserType" VARCHAR(50) NOT NULL CHECK ("UserType" IN ('Student', 'Instructor')),
    "FullName" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "Password" BYTEA,
    "VerifyCode" VARCHAR(255),
    "ExpireVerifyCode" TIMESTAMP,
    "IsVerified" BOOLEAN DEFAULT FALSE,
    "OnboardComplete" BOOLEAN DEFAULT FALSE,
    "AvatarSecureURL" VARCHAR(255),
    "Bio" TEXT,
    "Expertise" VARCHAR(255),
    "Age" INT,
    "DesireRole" VARCHAR(255),
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to update UpdatedAt on row updates
CREATE OR REPLACE FUNCTION update_updatedat_column()
RETURNS TRIGGER AS $$
BEGIN
   IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN -- Checks if anything changed
      NEW.UpdatedAt = CURRENT_TIMESTAMP;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after UPDATE
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE FUNCTION update_updatedat_column();




-- Enrollement table
CREATE TABLE "EnrolledCourses" (
    "UserID" INT NOT NULL,
    "CourseID" INT NOT NULL,
    "EnrollmentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CompletionStatus" BOOLEAN DEFAULT FALSE,
    "CompletionDate" TIMESTAMP,
    "TotalLearningHours" INT DEFAULT 0,
    PRIMARY KEY ("UserID", "CourseID"),
    FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE,
    FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID") ON DELETE NO ACTION
);

-- Covering index for user statistics (count and sum operations)
CREATE INDEX "IDX_EnrolledCourses_UserID_Stats" 
ON "EnrolledCourses"("UserID", "TotalLearningHours", "EnrollmentDate", "CourseID");

-- Optimized index for recent courses query (sorted by enrollment date)
CREATE INDEX "IDX_EnrolledCourses_UserID_EnrollmentDate" 
ON "EnrolledCourses"("UserID", "EnrollmentDate" DESC, "CourseID");

-- Index for the foreign key relationship (on CourseID)
CREATE INDEX "IDX_EnrolledCourses_CourseID" 
ON "EnrolledCourses"("CourseID");






-- CourseProgress to track user progress in course
CREATE TABLE "CourseProgress" (
    "UserID" INT NOT NULL,
    "CourseID" INT NOT NULL,
    "ChapterID" INT NOT NULL,
    "IsCompleted" BOOLEAN DEFAULT FALSE,
    "LastAccessed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("UserID", "CourseID", "ChapterID"),
    FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE,
    FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID") ON DELETE CASCADE,
    FOREIGN KEY ("ChapterID") REFERENCES "Courses_Chapters"("ChapterID") ON DELETE CASCADE
);






-- certification table
CREATE SEQUENCE "certifications_certificationid_seq" START 1;

CREATE TABLE "Certifications" (
    "CertificationID" INT DEFAULT nextval('certifications_certificationid_seq') PRIMARY KEY,
    "UserID" INT NOT NULL,
    "CourseID" INT NOT NULL,
    "CertificationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CertificationTitle" VARCHAR(255) NOT NULL,
    "CertificationDetails" TEXT,
    FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE,
    FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID") ON DELETE NO ACTION
);






-- instructor table
CREATE TABLE "InstructorCourses" (
    "UserID" INT NOT NULL,
    "CourseID" INT NOT NULL,
    PRIMARY KEY ("UserID", "CourseID"),
    FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE,
    FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID") ON DELETE NO ACTION
);


