import { Button } from '@/components/ui/button'
import { X, Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import axios from 'axios'

interface CourseFormHeaderProps {
  courseStatus: string
  updateCourseField: (field: string, value: string) => Promise<void>
  courseId: string // Add courseId to identify the course to delete
  onDeleteCourse: () => Promise<void> // Add onDeleteCourse prop
}

export default function CourseFormHeader({ courseStatus, updateCourseField, onDeleteCourse }: CourseFormHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const toggleDraftStatus = () => {
    const newStatus = courseStatus === 'draft' ? 'published' : 'draft'
    updateCourseField('Status', newStatus)
  }

  const handleExit = () => {
    router.push('/instructor/courses')
  }

  const handleDeleteCourse = async () => {
    try {
      // Call the onDeleteCourse function passed from the parent component
      await onDeleteCourse()
    } catch (error) {
      console.error('Error deleting course:', error)
      toast({
        title: "Fail to deleteing Course.",
        description: axios.isAxiosError(error)
          ? error.response?.data.error || "Something went wrong!"
          : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:text-white backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto min-w-full">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Course Details</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={courseStatus === 'draft' ? 'outline' : 'default'}
                size="sm"
                onClick={toggleDraftStatus}
                className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
              >
                {courseStatus === 'draft' ? 'Publish' : 'Unpublish'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 dark:text-gray-300"
                onClick={handleExit}
              >
                <X className="h-4 w-4" />
                Exit
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}