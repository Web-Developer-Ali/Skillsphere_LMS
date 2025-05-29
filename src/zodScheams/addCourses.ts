import * as z from "zod";

export const formSchema = z.object({
  title: z.string().min(3, {
    message: "Course title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Course description must be at least 10 characters.",
  }),
  category: z.string({
    required_error: "Please select a course category.",
  }),
  skillLevel: z.string({
    required_error: "Please select a skill level.",
  }),
  isFree: z.boolean(),
  price: z.number().min(0).max(200).optional(),
  courseThumbnail: z
    .any()
    .refine((files) => files?.length == 1, "Course thumbnail is required.")
    .refine(
      (files) => files?.[0]?.type.startsWith("image/") || files?.[0]?.type.startsWith("video/"),
      "Only image or video files are allowed for the thumbnail."
    )
    .refine(
      (files) => files?.[0]?.type.startsWith("video/") ? files[0].size <= 100 * 1024 * 1024 : true,
      "Video thumbnail must be 1 minute or less in duration (max 100MB)."
    ),
});

export const CourseSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  skillLevel: z.string().min(1, "Skill level is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  isFree: z.boolean(),
  price: z.number().min(0).max(200).optional(),
  courseThumbnail: z.any(),
});



export type FormSchema = z.infer<typeof formSchema>;

