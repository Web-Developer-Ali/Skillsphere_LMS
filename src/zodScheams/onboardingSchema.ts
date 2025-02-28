import { z } from "zod";

export const recruiterSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyLocation: z.string().min(1, "Company location is required"),
  companyRole: z.string().min(1, "Company role is required"),
  linkedinProfile: z.string().url("Invalid LinkedIn URL"),
});

export const candidateSchema = z.object({
  previous_companies: z.array(z.object({ name: z.string() })),
  preferred_location: z.string().min(1, "Preferred location is required"),
  user_Role: z.string().min(1, "Desired role is required"),
  experience: z.string().min(1, "Experience is required"),
  skills: z.array(z.object({ name: z.string() })),
  linkedinProfile: z.string().url("Invalid LinkedIn URL"),
  graduation: z.string().min(1, "Graduation details are required"),
  resumeUrl: z.string().url("Invalid resume URL"),
});

// Validation schema for student data
export const studentSchema = z.object({
  age: z.number().min(13, { message: "Age must be at least 13" }).max(120, { message: "Age must be less than 120" }),
  desire_role: z.string().min(2, { message: "Desire role must be at least 2 characters long" }),
});

// Validation schema for instructor data
export const instructorSchema = z.object({
  bio: z.string().min(10, { message: "Bio must be at least 10 characters long" }),
  expertise: z.string().min(2, { message: "Expertise must be at least 2 characters long" }),
});

// Define proper types using z.infer
type StudentData = z.infer<typeof studentSchema>;
type InstructorData = z.infer<typeof instructorSchema>;

// Function to validate student data
export function validateStudentData(data: StudentData) {
  return studentSchema.parse(data); // Will throw an error if validation fails
}

// Function to validate instructor data
export function validateInstructorData(data: InstructorData) {
  return instructorSchema.parse(data); // Will throw an error if validation fails
}
