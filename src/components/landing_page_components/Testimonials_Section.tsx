import React from 'react'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import Image from 'next/image'
import { Star } from 'lucide-react'

function Testimonials_Section() {
  return (
    <section className="py-8 sm:py-12 md:py-24 lg:py-32 bg-background dark:bg-gray-900">
          <div className="min-w-full container px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge className="inline-flex" variant="secondary">
                  Testimonials
                </Badge>
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl dark:text-gray-100">
                  What our users say
                </h2>
                <p className="max-w-[900px] text-sm text-muted-foreground sm:text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
                  Hear from our community of students and teachers about their experience with SkillSphere.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote:
                    "SkillSphere transformed my teaching career. I now reach thousands of students worldwide and earn a sustainable income doing what I love.",
                  name: "Professor Mark Wilson",
                  role: "Computer Science Instructor",
                  image: "https://randomuser.me/api/portraits/men/32.jpg",
                },
                {
                  quote:
                    "The quality of courses on SkillSphere is unmatched. I've learned more in 3 months than I did in a year of traditional education.",
                  name: "Sophia Garcia",
                  role: "UX Design Student",
                  image: "https://randomuser.me/api/portraits/women/44.jpg",
                },
                {
                  quote:
                    "As someone switching careers, SkillSphere provided exactly what I needed - practical skills taught by industry experts that employers actually value.",
                  name: "James Taylor",
                  role: "Career Changer",
                  image: "https://randomuser.me/api/portraits/men/62.jpg",
                },
              ].map((testimonial, index) => (
                <Card key={index} className="text-center dark:bg-gray-800">
                  <CardHeader>
                    <div className="mx-auto h-20 w-20 overflow-hidden rounded-full">
                      <Image
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex justify-center py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 fill-primary dark:fill-blue-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground sm:text-base dark:text-gray-300">
                      "{testimonial.quote}"
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <div className="font-semibold dark:text-gray-100">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-300">{testimonial.role}</div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
  )
}

export default Testimonials_Section