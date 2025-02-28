import type React from "react"
import type { UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { z } from "zod"
import dynamic from "next/dynamic"
import "react-quill/dist/quill.snow.css"
import type { CourseSchema } from "@/zodScheams/addCourses"
import { Loader2 } from "lucide-react"

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
})

type FormSchema = z.infer<typeof CourseSchema>

interface Add_coursesFormProps {
  form: UseFormReturn<FormSchema>
}

const Add_coursesForm: React.FC<Add_coursesFormProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="dark:text-gray-200">Course Title</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter course title"
                {...field}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </FormControl>
            <FormDescription className="dark:text-gray-400">
              Give your course a clear and concise title.
            </FormDescription>
            <FormMessage className="dark:text-red-400" />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="dark:text-gray-200">Course Description</FormLabel>
            <FormControl>
              <ReactQuill
                theme="snow"
                value={field.value}
                onChange={field.onChange}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "underline", "strike", "blockquote"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
              />
            </FormControl>
            <FormDescription className="dark:text-gray-400">
              Provide a detailed description of the course, including its goals and expected outcomes.
            </FormDescription>
            <FormMessage className="dark:text-red-400" />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-200">Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="dark:bg-gray-800 dark:text-white">
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="dark:text-gray-400">
                Choose the category that best fits your course.
              </FormDescription>
              <FormMessage className="dark:text-red-400" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="skillLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-200">Skill Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="dark:bg-gray-800 dark:text-white">
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="dark:text-gray-400">
                Indicate the skill level required for this course.
              </FormDescription>
              <FormMessage className="dark:text-red-400" />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="dark:text-gray-200">Skills (Comma separated)</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter skills, separated by commas"
                value={field.value?.join(", ")}
                onChange={(e) => {
                  const skills = e.target.value.split(",").map((skill) => skill.trim())
                  field.onChange(skills)
                }}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </FormControl>
            <FormDescription className="dark:text-gray-400">
              List the key skills that students will gain from this course.
            </FormDescription>
            <FormMessage className="dark:text-red-400" />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="isFree"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 dark:border-gray-600 dark:bg-gray-800">
            <div className="space-y-0.5">
              <FormLabel className="text-base dark:text-gray-200">Free Course</FormLabel>
              <FormDescription className="dark:text-gray-400">
                Mark this course as free for all students.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      {!form.watch("isFree") && (
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-200">Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </FormControl>
              <FormDescription className="dark:text-gray-400">Set the price for this course.</FormDescription>
              <FormMessage className="dark:text-red-400" />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={form.control}
        name="courseThumbnail"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="dark:text-gray-200">Course Thumbnail</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && file.type.startsWith("image/")) {
                    field.onChange([file])
                  } else {
                    form.setError("courseThumbnail", {
                      type: "manual",
                      message: "Only image files are allowed for the thumbnail.",
                    })
                  }
                }}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </FormControl>
            <FormDescription className="dark:text-gray-400">Upload an image as your course thumbnail.</FormDescription>
            <FormMessage className="dark:text-red-400" />
          </FormItem>
        )}
      />
    </div>
  )
}

export default Add_coursesForm

