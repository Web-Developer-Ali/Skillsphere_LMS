"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { signUpSchema } from "@/zodScheams/signSchema";
import nprogress from 'nprogress'; 
import 'nprogress/nprogress.css';

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    nprogress.start();
    setIsLoading(true);
    try {
      const response = await axios.post("/api/registeration/sign-up", {
        full_Name: data.fullName,
        email: data.email,
        password: data.password,
      });
        toast({
        title: "Success",
        description: response.data.message,
      });
      router.replace(`/verify?userId=${response.data.userId}`);
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: axios.isAxiosError(error)
          ? error.response?.data.message || "Something went wrong!"
          : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      nprogress.done();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google", { redirect: false });
      if (result?.error) {
        toast({
          title: "Sign in failed",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      } else if (result?.url) {
        router.replace(result.url);
      }
    } catch {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center dark:text-white">
            Create an account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="dark:text-gray-300">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                {...register("password")} 
              />
              {errors.password && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="dark:text-gray-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" className="dark:border-gray-600" />
              <Label htmlFor="terms" className="text-sm dark:text-gray-300">
                I accept the{" "}
                <Link 
                  href="#" 
                  className="text-blue-500 hover:underline dark:text-blue-400"
                >
                  Terms and Conditions
                </Link>
              </Label>
            </div>
            <Button 
              type="submit" 
              className="w-full dark:bg-primary dark:hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create an account"}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full dark:border-gray-600 dark:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Sign in with Google
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link 
              href="/sign-in" 
              className="text-blue-500 hover:underline dark:text-blue-400"
            >
              Sign in here
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}