'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import * as z from 'zod';
import { signIn, useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

const signInSchema = z.object({
  identifier: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

function SignInForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  
  // Watch for session changes after sign-in
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === 'Student') {
        router.replace('/student/dashboard');
      } else if (session?.user?.role === 'Instructor') {
        router.replace('/instructor/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [session, status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.identifier,
        password: data.password,
      });

      if (!result?.ok) {
        toast({
          title: "Sign in failed",
          description: result?.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
      // The useEffect will handle the redirect when session becomes available
    } catch (error) {
      console.error("Error in signing in user:", error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
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
            Sign in to your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="dark:text-gray-300">
                Your email
              </Label>
              <Input
                id="identifier"
                type="email"
                placeholder="name@example.com"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.identifier.message}
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
                placeholder="••••••••"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
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
            <Button 
              type="submit" 
              className="w-full dark:bg-primary dark:hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {"Don't have an account yet?"}{' '}
            <Link 
              href="/sign-up" 
              className="text-blue-500 hover:underline dark:text-blue-400"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center dark:bg-gray-900">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}