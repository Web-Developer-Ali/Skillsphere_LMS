import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700 w-full">
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <CardHeader className="p-4">
        <div className="flex gap-2 mb-2">
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardContent>
      <CardFooter className="flex justify-between p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardFooter>
    </Card>
  )
}

