import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Video, X } from "lucide-react"
import { UseFormReturn } from "react-hook-form";

interface FormValues {
  title: string;
  description: string;
  video: File;
  isFreePreview: boolean;
}

interface ChapterVideoUploadProps {
  form: UseFormReturn<FormValues>;
  videoPreview: string | null
  onVideoChange: (file: File | undefined) => void
}

export const ChapterVideoUpload = ({ form, videoPreview, onVideoChange }: ChapterVideoUploadProps) => {
  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Video className="h-5 w-5 text-primary dark:text-blue-400" />
          <CardTitle className="dark:text-white">Add a video</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="video"
          render={({ field }) => {
            // Extract only the properties we need, excluding 'value'
            const { onChange, name, onBlur, ref } = field;
            
            return (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="video/*"
                      name={name}
                      onBlur={onBlur}
                      ref={ref}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          onChange(file)
                          onVideoChange(file)
                        }
                      }}
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    {videoPreview && (
                      <div className="relative aspect-video">
                        <video src={videoPreview} controls className="w-full h-full object-cover rounded-lg" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 dark:bg-red-600 dark:hover:bg-red-700"
                          onClick={() => {
                            onChange(undefined)
                            onVideoChange(undefined)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage className="dark:text-red-400" />
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  )
}