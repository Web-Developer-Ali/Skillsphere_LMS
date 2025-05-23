import { ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import Image from 'next/image'
import { Badge } from '../ui/badge'

function Popular_Courses_Section() {
  return (
    <section id="courses" className="py-8 sm:py-12 md:py-24 lg:py-32 bg-secondary dark:bg-gray-800">
    <div className="min-w-full container px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <Badge className="inline-flex" variant="secondary">
            Popular Courses
          </Badge>
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl dark:text-gray-100">
            Start learning today
          </h2>
          <p className="max-w-[900px] text-sm text-muted-foreground sm:text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
            Explore our most popular courses across various categories and skill levels.
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Web Development Fundamentals",
            category: "Programming",
            instructor: "Alex Johnson",
            rating: 4.9,
            reviews: 1240,
            price: "$49.99",
            image:
              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
          },
          {
            title: "Digital Marketing Mastery",
            category: "Marketing",
            instructor: "Sarah Williams",
            rating: 4.8,
            reviews: 856,
            price: "$59.99",
            image:
              "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
          },
          {
            title: "Data Science Essentials",
            category: "Data",
            instructor: "Michael Chen",
            rating: 4.7,
            reviews: 1120,
            price: "Free",
            image:
              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
          },
          {
            title: "Graphic Design for Beginners",
            category: "Design",
            instructor: "Emma Rodriguez",
            rating: 4.9,
            reviews: 932,
            price: "$39.99",
            image:
              "https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
          },
          {
            title: "Business Leadership Skills",
            category: "Business",
            instructor: "David Thompson",
            rating: 4.8,
            reviews: 745,
            price: "$69.99",
            image:
              "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
          },
          {
            title: "Mobile App Development",
            category: "Programming",
            instructor: "Jessica Lee",
            rating: 4.7,
            reviews: 890,
            price: "$54.99",
            image:
              "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
          },
        ].map((course, index) => (
          <Card key={index} className="overflow-hidden bg-background dark:bg-gray-900">
            <div className="aspect-video w-full overflow-hidden">
              <Image
                src={course.image || "/placeholder.svg"}
                alt={course.title}
                width={300}
                height={200}
                className="h-full w-full object-cover transition-all hover:scale-105"
              />
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="dark:text-white">{course.category}</Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-primary dark:fill-blue-400" />
                  <span>{course.rating}</span>
                  <span className="text-muted-foreground dark:text-gray-300">({course.reviews})</span>
                </div>
              </div>
              <CardTitle className="line-clamp-1 dark:text-gray-100">{course.title}</CardTitle>
              <CardDescription className="dark:text-gray-300">By {course.instructor}</CardDescription>
            </CardHeader>
            <CardFooter className="flex items-center justify-between">
              <div className="font-bold dark:text-gray-100">{course.price}</div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          className="gap-1 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400 dark:hover:text-white"
          asChild
        >
          <Link href="/student/browse-courses">
            View All Courses <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
  )
}

export default Popular_Courses_Section