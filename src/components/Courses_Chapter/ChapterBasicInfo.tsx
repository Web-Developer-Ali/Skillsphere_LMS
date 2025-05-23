// components/chapters/ChapterBasicInfo.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LayoutGrid } from "lucide-react"
import dynamic from "next/dynamic"
import { UseFormReturn } from "react-hook-form";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "../../app/quill-dark.css"

interface FormValues {
  title: string;
  description: string;
  video: File;
  isFreePreview: boolean;
}

interface ChapterBasicInfoProps {
  form: UseFormReturn<FormValues>; // Use the correct type
}

export const ChapterBasicInfo = ({ form }: ChapterBasicInfoProps) => {
  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <LayoutGrid className="h-5 w-5 text-primary dark:text-blue-400" />
          <CardTitle className="dark:text-white">Customize your chapter</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-300">Chapter title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Introduction"
                  {...field}
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </FormControl>
              <FormMessage className="dark:text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-300">Chapter description</FormLabel>
              <FormControl>
                <ReactQuill
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  className="dark:text-white"
                />
              </FormControl>
              <FormMessage className="dark:text-red-400" />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}