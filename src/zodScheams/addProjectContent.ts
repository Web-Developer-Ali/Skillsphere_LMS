import * as z from "zod"


export const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    video: z.instanceof(File).optional(),
    isFreePreview: z.boolean(),
  });

  