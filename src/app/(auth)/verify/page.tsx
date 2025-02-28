'use client';

import { useToast } from '@/hooks/use-toast';
import { verifySchema } from '@/zodScheams/verifySchema';
import { ApiResponce } from '@/types/ApiResponce';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, Suspense } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

function VerifyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams(); // Must be inside Suspense
  const userId = searchParams.get('userId');

  console.log('userId:', userId);

  const { register, handleSubmit } = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof verifySchema>> = async (data) => {
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/registeration/verify-code', {
        id: userId,
        code: data.code,
      });
      toast({
        title: 'Success',
        description: response.data.message,
      });
      router.replace(`/onboarding?userId=${userId}&email_user=true`);
    } catch (error) {
      console.error('Error in verifying code:', error);
      const axiosError = error as AxiosError<ApiResponce>;
      const errorMessage = axiosError.response?.data.message;
      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dark:bg-gray-800 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Verify OTP</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Enter OTP
            </label>
            <input
              type="text"
              id="code"
              {...register('code')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black dark:text-white bg-white dark:bg-gray-800 sm:text-sm"
              required
              placeholder="Enter your OTP"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </section>
  );
}

// Wrap useSearchParams in a Suspense boundary
function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <VerifyForm />
    </Suspense>
  );
}

export default Page;
