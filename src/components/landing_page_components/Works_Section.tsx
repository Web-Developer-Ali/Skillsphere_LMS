import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'

function Works_Section() {
  return (
    <section id="how-it-works" className="py-8 sm:py-12 md:py-24 lg:py-32 bg-background dark:bg-gray-900">
          <div className="min-w-full container px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge className="inline-flex" variant="secondary">
                  How It Works
                </Badge>
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl dark:text-gray-100">
                  Simple for everyone
                </h2>
                <p className="max-w-[900px] text-sm text-muted-foreground sm:text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
                  Whether you're here to teach or learn, SkillSphere makes the process straightforward and rewarding.
                </p>
              </div>
            </div>
            <div className="mx-auto py-12">
              <Tabs defaultValue="students" className="mx-auto max-w-4xl">
                <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800">
                  <TabsTrigger value="students">For Students</TabsTrigger>
                  <TabsTrigger value="teachers">For Teachers</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-6">
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        step: "1",
                        title: "Create an Account",
                        description: "Sign up for free and set up your learning profile with your interests and goals.",
                      },
                      {
                        step: "2",
                        title: "Discover Courses",
                        description: "Browse our extensive catalog of courses or get personalized recommendations.",
                      },
                      {
                        step: "3",
                        title: "Learn at Your Pace",
                        description: "Enroll in courses and learn whenever, wherever, with lifetime access to content.",
                      },
                    ].map((step, index) => (
                      <Card key={index} className="dark:bg-gray-800">
                        <CardHeader>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary dark:bg-blue-600 text-primary-foreground">
                            {step.step}
                          </div>
                          <CardTitle className="mt-2 dark:text-gray-100">{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="dark:text-gray-300">{step.description}</CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="teachers" className="mt-6">
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        step: "1",
                        title: "Apply as Instructor",
                        description: "Complete our simple application process and showcase your expertise.",
                      },
                      {
                        step: "2",
                        title: "Create Your Course",
                        description:
                          "Use our intuitive course builder to upload videos, create quizzes, and structure your content.",
                      },
                      {
                        step: "3",
                        title: "Earn & Grow",
                        description: "Get paid for your knowledge while building your reputation and student base.",
                      },
                    ].map((step, index) => (
                      <Card key={index} className="dark:bg-gray-800">
                        <CardHeader>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary dark:bg-blue-600 text-primary-foreground">
                            {step.step}
                          </div>
                          <CardTitle className="mt-2 dark:text-gray-100">{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="dark:text-gray-300">{step.description}</CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

  )
}

export default Works_Section