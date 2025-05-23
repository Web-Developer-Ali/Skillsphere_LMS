// components/chapters/ChapterHeader.tsx
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


interface ChapterHeaderProps {
  isProcessing: boolean;
  onSubmit: () => void;
  id: string | null;
}

export const ChapterHeader = ({
  isProcessing,
  onSubmit,
  id
}: ChapterHeaderProps) => {
  const router = useRouter()
  const handleExit = () => {
    router.push(`/instructor/courses_details_page/${id}`)
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold dark:text-white">
          Chapter creation
        </h1>
        <p className="text-sm text-muted-foreground dark:text-gray-400">
          Complete all fields (1/3)
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
          onClick={handleExit}
        >
          Exit
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isProcessing}
          className="dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {isProcessing ? "Processing..." : "Publish"}
        </Button>
      </div>
    </header>
  );
};
