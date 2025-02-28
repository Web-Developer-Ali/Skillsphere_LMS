"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Upload, PenLine } from "lucide-react";
import type { CourseData } from "@/types/course";
import dynamic from "next/dynamic"; // Import dynamic from Next.js

// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css"; // Import Quill styles

interface CourseDetailsProps {
  courseData: CourseData;
  updateCourseField: (field: string, value: string | File) => Promise<void>;
}

export default function CourseDetails({ courseData, updateCourseField }: CourseDetailsProps) {
  const [title, setTitle] = useState(courseData.Title);
  const [description, setDescription] = useState(courseData.Description);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [sasURL, setSasURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSasURL = useCallback(async () => {
    if (courseData.ThumbnailPublicID) {
      try {
        const response = await fetch(`/api/generate-sas-token?blobName=${courseData.ThumbnailPublicID}`);
        const data = await response.json();
        setSasURL(data.sasURL);
      } catch (error) {
        console.error("Error fetching SAS URL:", error);
        setSasURL(null);
      }
    }
  }, [courseData.ThumbnailPublicID]);

  useEffect(() => {
    fetchSasURL();
  }, [fetchSasURL]);

  const handleUpdateField = async (field: "Title" | "Description") => {
    await updateCourseField(field, field === "Title" ? title : description);
    
    if (field === "Title") {
      setIsEditingTitle(false);
    } else {
      setIsEditingDescription(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await updateCourseField("ThumbnailPublicID", file);
      fetchSasURL(); // Refresh the image after update
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-xl font-semibold dark:text-white">
        <LayoutGrid className="h-6 w-6 text-blue-500 dark:text-blue-400" />
        <h2>Customize your course</h2>
      </div>

      <Card className="shadow-md dark:bg-gray-700">
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium dark:text-gray-200">Course title</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTitle(!isEditingTitle)}
                className="dark:text-gray-300 dark:hover:text-white"
              >
                <PenLine className="h-4 w-4 mr-2" />
                {isEditingTitle ? "Cancel" : "Edit"}
              </Button>
            </div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-grow dark:bg-gray-600 dark:text-white"
                />
                <Button onClick={() => handleUpdateField("Title")} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                  Update
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-lg dark:text-gray-300">{courseData.Title}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium dark:text-gray-200">Course description</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDescription(!isEditingDescription)}
                className="dark:text-gray-300 dark:hover:text-white"
              >
                <PenLine className="h-4 w-4 mr-2" />
                {isEditingDescription ? "Cancel" : "Edit"}
              </Button>
            </div>
            {isEditingDescription ? (
              <div className="flex flex-col gap-2">
                <ReactQuill
                  value={description}
                  onChange={(value) => setDescription(value)}
                  placeholder="Enter your course description..."
                  className="dark:bg-gray-600 dark:text-white"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                  theme="snow"
                />
                <Button
                  onClick={() => handleUpdateField("Description")}
                  className="dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Update
                </Button>
              </div>
            ) : (
              <div
                className="text-muted-foreground dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: courseData.Description || "No description added yet." }}
              />
            )}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium dark:text-gray-200">Course image</label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center dark:border-gray-600">
              {sasURL ? (
                <Image
                  src={sasURL || "/placeholder.svg"}
                  alt="Course thumbnail"
                  width={200}
                  height={200}
                  className="mx-auto mb-4 rounded-lg"
                />
              ) : (
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-gray-400" />
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
                onClick={() => fileInputRef.current?.click()}
              >
                {courseData.ThumbnailPublicID ? "Change image" : "Add an image"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
