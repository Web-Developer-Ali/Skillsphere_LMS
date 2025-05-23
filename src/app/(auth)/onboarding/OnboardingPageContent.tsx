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
import nprogress from 'nprogress'; 
import 'nprogress/nprogress.css';
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
    nprogress.start();
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
            isStudent ? "/student/dashboard" : "/instructor/dashboard"
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
    }finally {
      nprogress.done();
    }
  }

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="container max-w-lg mx-auto px-4 py-8 dark:bg-gray-900">
      <Card className="w-full dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center dark:text-white">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-center dark:text-gray-300">
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
                    <FormLabel className="dark:text-gray-300">I am a</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const userType = value as "Student" | "Instructor";
                        field.onChange(userType);
                        setIsStudent(userType === "Student");
                        form.reset({ userType });
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem 
                          value="Student" 
                          className="dark:hover:bg-gray-600 dark:text-white dark:hover:text-white dark:focus:bg-gray-600"
                        >
                          Student
                        </SelectItem>
                        <SelectItem 
                          value="Instructor"
                          className="dark:hover:bg-gray-600 dark:text-white dark:hover:text-white dark:focus:bg-gray-600"
                        >
                          Instructor
                        </SelectItem>
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
                        <FormLabel className="dark:text-gray-300">Age</FormLabel>
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
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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
                        <FormLabel className="dark:text-gray-300">Desired Role</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Web Developer, Data Scientist"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                          />
                        </FormControl>
                        <FormDescription className="dark:text-gray-400">
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
                        <FormLabel className="dark:text-gray-300">Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about yourself and your teaching experience"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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
                        <FormLabel className="dark:text-gray-300">Area of Expertise</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., JavaScript, Machine Learning"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                          />
                        </FormControl>
                        <FormDescription className="dark:text-gray-400">
                          What subjects do you specialize in teaching?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button 
                className="w-full dark:bg-primary dark:hover:bg-primary/90" 
                type="submit"
              >
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    </div>
    
  );
}