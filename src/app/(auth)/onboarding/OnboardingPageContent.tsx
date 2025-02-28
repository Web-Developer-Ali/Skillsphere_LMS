"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const studentSchema = z.object({
  age: z
    .number()
    .min(13, "You must be at least 13 years old")
    .max(120, "Please enter a valid age"),
  desire_role: z.string().min(2, "Please enter your desired role"),
});

const instructorSchema = z.object({
  bio: z
    .string()
    .min(10, "Please provide a brief bio (at least 10 characters)"),
  expertise: z.string().min(2, "Please enter your area of expertise"),
});

const commonSchema = z.object({
  userType: z.enum(["Student", "Instructor"]),
});

const studentFormSchema = commonSchema.merge(studentSchema);
const instructorFormSchema = commonSchema.merge(instructorSchema);

type FormValues =
  | z.infer<typeof studentFormSchema>
  | z.infer<typeof instructorFormSchema>;

export default function OnboardingPageContent() {
  const [isStudent, setIsStudent] = useState(true);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const form = useForm<FormValues>({
    resolver: zodResolver(isStudent ? studentFormSchema : instructorFormSchema),
    defaultValues: {
      userType: "Student",
      age: undefined,
      desire_role: "",
      bio: "",
      expertise: "",
    },
  });

  const id = searchParams.get("userId");
  const isEmailUser = searchParams.get("email_user");
  useEffect(() => {
    if (session?.user?.onboardComplete) {
      router.push(isStudent ? "/student/dashboard" : "/instructor/dashboard");
    }
  }, [session, router, isStudent]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const relevantFields = isStudent
        ? ["userType", "age", "desire_role"]
        : ["userType", "bio", "expertise"];
      const filledFields = relevantFields.filter(
        (field) => value[field as keyof FormValues]
      );
      setProgress((filledFields.length / relevantFields.length) * 100);
    });
    return () => subscription.unsubscribe();
  }, [form, isStudent]);

  async function onSubmit(values: FormValues) {
    try {
      const response = await axios.put("/api/registeration/onboarding", {
        ...values,
        id,
      });
      if (response.data.success) {
        if (!isEmailUser) {
          await update({
            onboardComplete: true,
            role: isStudent ? "Student" : "Instructor",
          });
          toast({
            title: "Welcome to SkillSphere!",
            description: "Your profile has been set up successfully.",
          });
          router.push(
            isStudent ? "/dashboard/student" : "/dashboard/instructor"
          );
        } else {
          router.replace(
            `/sign-in?user=${isStudent ? "student" : "instructor"}`
          );
        }
      }
    } catch {
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't update your profile. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-center">
            Let&#39;s personalize your SkillSphere experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-6" />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Explicitly ensure value is "Student" | "Instructor"
                        const userType = value as "Student" | "Instructor";
                        field.onChange(userType);
                        setIsStudent(userType === "Student");
                        form.reset({ userType }); // Ensure compatibility with the schema
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {isStudent ? (
                <>
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined
                              )
                            }
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="desire_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Role</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Web Developer, Data Scientist"
                          />
                        </FormControl>
                        <FormDescription>
                          What role are you aspiring to?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about yourself and your teaching experience"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expertise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area of Expertise</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., JavaScript, Machine Learning"
                          />
                        </FormControl>
                        <FormDescription>
                          What subjects do you specialize in teaching?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button className="w-full" type="submit">
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
