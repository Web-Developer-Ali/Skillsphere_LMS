import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormDescription, FormControl } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Eye } from "lucide-react";
import { UseFormReturn } from "react-hook-form"; // Import the type

// Define the shape of your form values to match the parent component's schema
interface FormValues {
  title: string;
  description: string;
  video: File;
  isFreePreview: boolean;
}

interface ChapterAccessSettingsProps {
  form: UseFormReturn<FormValues>; // Use the correct type
}

export const ChapterAccessSettings = ({ form }: ChapterAccessSettingsProps) => {
  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-primary dark:text-blue-400" />
          <CardTitle className="dark:text-white">Access Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="isFreePreview"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 dark:border-gray-700">
              <div className="space-y-0.5">
                <FormLabel className="text-base dark:text-gray-300">Free Preview Chapter</FormLabel>
                <FormDescription className="dark:text-gray-400">
                  This chapter is {field.value ? "" : "not"} free.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} className="dark:bg-gray-600" />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};