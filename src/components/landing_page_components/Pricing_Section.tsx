import React from "react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

function Pricing_Section() {
  return (
    <section
      id="pricing"
      className="py-8 sm:py-12 md:py-24 lg:py-32 bg-secondary dark:bg-gray-900"
    >
      <div className="min-w-full container px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <Badge className="inline-flex" variant="secondary">
              Pricing
            </Badge>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl dark:text-white">
              Simple, transparent pricing
            </h2>
            <p className="max-w-[900px] text-sm text-muted-foreground sm:text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
              Choose the plan that&#39;s right for you, whether you&#39;re just
              starting out or looking for more advanced features.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Beginner Courses",
              price: "$29",
              description: "Entry-level skill development",
              features: [
                "4-6 week duration",
                "Beginner-friendly content",
                "Certificate of completion",
                "Community access",
                "Lifetime access to materials",
              ],
              cta: "Browse Courses",
              ctaLink: "/student/browse-courses",
              popular: false,
              type: "enrollment",
            },
            {
              title: "Intermediate Courses",
              price: "$49",
              description: "Skill advancement programs",
              features: [
                "6-8 week duration",
                "Project-based learning",
                "Verified certificate",
                "Instructor Q&A",
                "Career guidance",
              ],
              cta: "Browse Courses",
              ctaLink: "/student/browse-courses",
              popular: true,
              type: "enrollment",
            },
            {
              title: "Advanced Courses",
              price: "$79",
              description: "Professional mastery programs",
              features: [
                "8-12 week duration",
                "Capstone projects",
                "Professional certificate",
                "Mentorship sessions",
                "Job placement assistance",
              ],
              cta: "Browse Courses",
              ctaLink: "/student/browse-courses",
              popular: false,
              type: "enrollment",
            },
          ].map((course, index) => (
            <Card
              key={`course-${index}`}
              className={`${
                course.popular
                  ? "border-primary shadow-lg dark:shadow-primary/20"
                  : ""
              } dark:bg-gray-800 dark:border-gray-700`}
            >
              <CardHeader className="text-center">
                <CardTitle className="dark:text-white">
                  {course.title}
                </CardTitle>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-bold dark:text-white">
                    {course.price}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1 dark:text-gray-300">
                    per course
                  </span>
                </div>
                <CardDescription className="dark:text-gray-400">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {course.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center dark:text-gray-300"
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={course.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={course.ctaLink}>{course.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing_Section;
