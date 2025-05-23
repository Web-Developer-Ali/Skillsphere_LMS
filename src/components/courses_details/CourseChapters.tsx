"use client";

import { useState } from "react";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Define a custom API response type
interface ApiResponse {
  message?: string;
  error?: string;
}

interface Chapter {
  ChapterCount: number;
  Title: string;
  Status: string;
  ChapterID: number;
}

interface CourseChaptersProps {
  courseId: string;
  chapters: Chapter[];
  onChapterDelete: (deletedChapterId: number) => void; // Add this prop
}

function SortableItem({ chapter, onDelete }: { chapter: Chapter; index: number; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.ChapterCount.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex justify-between items-center p-4 rounded-md bg-white dark:bg-gray-800 shadow-sm"
    >
      <div className="flex items-center space-x-4">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <span className="text-sm font-medium dark:text-gray-300">{chapter.Title}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className={`text-xs font-semibold ${chapter.Status === "Published" ? "text-green-500" : "text-blue-500"}`}>
          {chapter.Status}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
        </Button>
      </div>
    </li>
  );
}

export default function CourseChapters({ courseId, chapters, onChapterDelete }: CourseChaptersProps) {
  const [chapterList, setChapterList] = useState(chapters);
  const [isChapterUpdating, setIsChapterUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Delete a chapter using axios
  const deleteChapter = async (chapterId: number) => {
    setIsChapterUpdating(true);
    try {
      const response = await axios.delete(`/api/instructor/update&delete_courses_chapters`, {
        params: { chapterId }
      });

      if (response.status === 200) {
        // Update local state
        setChapterList((prevChapters) => prevChapters.filter((chapter) => chapter.ChapterID !== chapterId));

        // Notify the parent component
        onChapterDelete(chapterId);

        toast({
          title: "Success",
          description: "Chapter deleted successfully",
        });
      } else {
        console.error("Failed to delete chapter:", response.data.message);
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete chapter",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse>;
        toast({
          title: "Error",
          description: axiosError.response?.data?.message || "Failed to delete chapter. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting the chapter.",
          variant: "destructive",
        });
      }
    } finally {
      setIsChapterUpdating(false);
    }
  };

  // Reorder chapters using axios
  const reorderChapters = async (newOrder: Chapter[]) => {
    setIsChapterUpdating(true);
    try {
      const response = await axios.put(`/api/instructor/update&delete_courses_chapters`, {
        courseId,
        chapters: newOrder
      });

      if (response.status === 200) {
        toast({
          title: "Success",
          description: response.data.message || "Chapters reordered successfully",
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse>;
        toast({
          title: "Error",
          description: axiosError.response?.data?.message || "Failed to update data. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while updating the course.",
          variant: "destructive",
        });
      }
    } finally {
      setIsChapterUpdating(false);
    }
  };

  // Handle drag-and-drop reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setIsChapterUpdating(true);
      const newItems = arrayMove(
        chapterList,
        chapterList.findIndex((item) => item.ChapterCount.toString() === active.id),
        chapterList.findIndex((item) => item.ChapterCount.toString() === over?.id)
      ).map((item, index) => ({
        ...item,
        ChapterCount: index + 1,
      }));

      setChapterList(newItems);
      await reorderChapters(newItems);
    }
  };

  return (
    <div className="space-y-6 relative">
      {isChapterUpdating && (
        <div className="absolute inset-0 rounded-lg flex items-center justify-center z-50">
          <div className="flex items-center">
            <Loader2 className="h-8 w-8 animate-spin mr-3 text-blue-500" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xl font-semibold dark:text-white">
        <ListTodo className="h-6 w-6 text-blue-500 dark:text-blue-400" />
        <h2>Course Chapters</h2>
      </div>

      <Card className="shadow-md dark:bg-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center justify-between dark:text-white">
            Course Chapters
            <Link href={`/instructor/add_courses_chapters/${courseId}`} passHref>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Add a Chapter
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {chapterList.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={chapterList.map((chapter) => chapter.ChapterCount.toString())}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {chapterList.map((chapter, index) => (
                    <SortableItem
                      key={chapter.ChapterCount}
                      chapter={chapter}
                      index={index}
                      onDelete={() => deleteChapter(chapter.ChapterID)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <>
              <p className="text-sm text-muted-foreground dark:text-gray-300">No chapters added yet</p>
              <p className="text-xs text-muted-foreground mt-2 dark:text-gray-400">
                Add chapters to structure your course content
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}