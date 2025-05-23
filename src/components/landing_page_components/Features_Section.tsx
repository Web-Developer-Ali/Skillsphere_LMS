import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BookOpen, CheckCircle, GraduationCap, Star, Users, Video } from 'lucide-react'
import { Badge } from '../ui/badge'

function Features_Section() {
  return (
    <section id="features" className="py-8 sm:py-12 md:py-24 lg:py-32 bg-secondary dark:bg-gray-800">
    <div className="container px-4 sm:px-6 min-w-full">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <Badge className="inline-flex" variant="secondary">
            Features
          </Badge>
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl dark:text-gray-100">
            Everything you need to learn and teach
          </h2>
          <p className="max-w-[900px] text-sm text-muted-foreground sm:text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
            SkillSphere provides a comprehensive platform for both educators and learners, with tools designed to
            make the learning experience seamless and effective.
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: <Video className="h-10 w-10 text-primary dark:text-blue-400" />,
            title: "High-Quality Video Content",
            description: "Stream HD video lessons with adaptive playback for any device or connection speed.",
          },
          {
            icon: <BookOpen className="h-10 w-10 text-primary dark:text-blue-400" />,
            title: "Comprehensive Courses",
            description: "Access structured learning paths with quizzes, assignments, and hands-on projects.",
          },
          {
            icon: <Users className="h-10 w-10 text-primary dark:text-blue-400" />,
            title: "Community Learning",
            description: "Connect with fellow learners and instructors through forums and live sessions.",
          },
          {
            icon: <Star className="h-10 w-10 text-primary dark:text-blue-400" />,
            title: "Expert Instructors",
            description:
              "Learn from industry professionals with real-world experience and proven teaching methods.",
          },
          {
            icon: <CheckCircle className="h-10 w-10 text-primary dark:text-blue-400" />,
            title: "Certificates & Achievements",
            description: "Earn recognized certificates upon course completion to showcase your skills.",
          },
          {
            icon: <GraduationCap className="h-10 w-10 text-primary dark:text-blue-400" />,
            title: "Personalized Learning",
            description: "Get recommendations based on your interests, goals, and learning patterns.",
          },
        ].map((feature, index) => (
          <Card key={index} className="bg-background dark:bg-gray-900">
            <CardHeader>
              <div className="mb-2">{feature.icon}</div>
              <CardTitle className="dark:text-gray-100">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="dark:text-gray-300">{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
  )
}

export default Features_Section