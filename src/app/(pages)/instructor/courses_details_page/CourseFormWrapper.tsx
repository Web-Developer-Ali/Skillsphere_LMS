// components/CourseFormWrapper.tsx
"use client";

import { Suspense } from "react";
import CourseForm from "./CourseForm";
import { Loader2 } from "lucide-react";

export default function CourseFormWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen dark:bg-gray-900 dark:text-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      }
    >
      <CourseForm />
    </Suspense>
  );
}