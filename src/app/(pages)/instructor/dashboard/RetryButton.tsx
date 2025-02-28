"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RetryButtonProps {
  onClick?: () => void; // Define the optional onClick prop
}

export default function RetryButton({ onClick }: RetryButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick(); 
    } else {
      router.refresh();
    }
  };

  return (
    <Button
      variant="default"
      className="w-full dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
      onClick={handleClick}
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Retry
    </Button>
  );
}