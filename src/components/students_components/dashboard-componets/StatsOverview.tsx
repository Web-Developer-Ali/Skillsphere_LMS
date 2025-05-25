import { BookOpen, Clock, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserInfo {
  enrolledCourseCount?: number;
  totalLearningHours?: number;
  certificationCount?: number;
}

interface StatsOverviewProps {
  userInfo: UserInfo;
}

export default function StatsOverview({ userInfo }: StatsOverviewProps) {
  return (
    <div className={`grid gap-4 grid-cols-2 md:grid-cols-4`}>
      <Card className="h-full dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium dark:text-gray-100">
            Courses in Progress
          </CardTitle>
          <BookOpen className="h-4 w-4 text-primary dark:text-blue-400" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold dark:text-white">
            {userInfo?.enrolledCourseCount || 0}
          </div>
        </CardContent>
      </Card>
      {/* second card */}
      <Card className="h-full dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium dark:text-gray-100">
            Minutes Learned
          </CardTitle>
          <Clock className="h-4 w-4 text-primary dark:text-blue-400" />
          
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold dark:text-white">
            {userInfo?.totalLearningHours || 0}
          </div>
        </CardContent>
      </Card>
      {/* Certification */}
      <Card className="h-full dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium dark:text-gray-100">
          Certificates
          </CardTitle>
          <Trophy className="h-4 w-4 text-primary dark:text-blue-400" />
         
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold dark:text-white">
            {userInfo?.certificationCount || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
