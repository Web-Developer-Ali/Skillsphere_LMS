"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formSchema } from "@/zodScheams/PaymentForm";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function PaymentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [price, setPrice] = useState("");
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      amount: "99.99",
    },
  });

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get(
          `/api/payment-gateway?courseId=${courseId}`
        );
        if (response.data.success === true) {
          setPrice(response.data.price);
        }
      } catch (error) {
        console.error("Error fetching price:", error);
      }
    };

    fetchPrice();
  }, [courseId]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const userId = session?.user.id;

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        `/api/payment-gateway?courseId=${courseId}&userId=${userId}`,
        {
          ...values,
          courseId,
          userId,
        }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Successfully enrolled in this course",
        });
        router.replace(
          `/${
            session?.user.role === "Student" ? "student" : "instructor"
          }/dashboard?new=true`
        );
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to enroll in course";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  // Determine card type based on first digits
  const getCardType = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s+/g, "");

    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6(?:011|5)/.test(cleanNumber)) return "discover";

    return "generic";
  };

  const cardType = getCardType(form.watch("cardNumber") || "");

  return (
    <div className="min-w-screen min-h-screen dark:bg-gray-800">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-200 hover:shadow-xl">
          <div className="p-6 sm:p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Payment Details
                    </h2>
                    <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                      <Lock className="h-3.5 w-3.5 mr-1" />
                      Secure
                    </div>
                  </div>

                  <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ${price}
                      </span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span>Card Number</span>
                          <div className="flex space-x-1">
                            <CardIcon
                              type="visa"
                              active={cardType === "visa"}
                            />
                            <CardIcon
                              type="mastercard"
                              active={cardType === "mastercard"}
                            />
                            <CardIcon
                              type="amex"
                              active={cardType === "amex"}
                            />
                          </div>
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              placeholder="1234 5678 9012 3456"
                              className="pr-10 transition-all border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              onChange={(e) => {
                                const formatted = formatCardNumber(
                                  e.target.value
                                );
                                field.onChange(formatted);
                              }}
                              maxLength={19}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <CreditCard className="h-5 w-5 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardholderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">
                          Cardholder Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John Smith"
                            className="transition-all border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryMonth"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            Month
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="transition-all border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="MM" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              {Array.from({ length: 12 }, (_, i) => {
                                const month = (i + 1)
                                  .toString()
                                  .padStart(2, "0");
                                return (
                                  <SelectItem
                                    key={month}
                                    value={month}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 hover:dark:text-white dark:text-white"
                                  >
                                    {month}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryYear"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            Year
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="transition-all border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="YY" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              {Array.from({ length: 10 }, (_, i) => {
                                const year = (new Date().getFullYear() + i)
                                  .toString()
                                  .slice(2);
                                return (
                                  <SelectItem
                                    key={year}
                                    value={year}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 hover:dark:text-white dark:text-white"
                                  >
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            CVV
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="123"
                              maxLength={4}
                              className="transition-all border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            3-4 digits
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

               <Button
                type="submit"
                className="w-full py-6 text-base font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  `Pay $${price}`
                )}
              </Button>
            </form>
          </Form>
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                <span>Your payment information is secure and encrypted</span>
              </div>

              <div className="mt-4 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-2">
                  Accepted Payment Methods
                </span>
                <div className="flex space-x-2">
                  <CardLogo type="visa" />
                  <CardLogo type="mastercard" />
                  <CardLogo type="amex" />
                  <CardLogo type="discover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card icon component for the form label
function CardIcon({ type, active }: { type: string; active: boolean }) {
  return (
    <div
      className={`w-8 h-5 rounded border flex items-center justify-center transition-all ${
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400"
          : "border-gray-200 dark:border-gray-700 opacity-50"
      }`}
    >
      <span
        className={`text-[10px] font-bold ${
          type === "visa"
            ? "text-blue-600 dark:text-blue-400"
            : type === "mastercard"
            ? "text-red-500 dark:text-red-400"
            : "text-blue-500 dark:text-blue-400"
        }`}
      >
        {type === "visa" && "VISA"}
        {type === "mastercard" && "MC"}
        {type === "amex" && "AMEX"}
      </span>
    </div>
  );
}

// Card logo component for the footer
function CardLogo({ type }: { type: string }) {
  return (
    <div className="h-6 w-10 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800">
      <span
        className={`text-xs font-bold ${
          type === "visa"
            ? "text-blue-600 dark:text-blue-400"
            : type === "mastercard"
            ? "text-red-500 dark:text-red-400"
            : type === "amex"
            ? "text-blue-500 dark:text-blue-400"
            : "text-orange-500 dark:text-orange-400"
        }`}
      >
        {type === "visa" && "VISA"}
        {type === "mastercard" && "MC"}
        {type === "amex" && "AMEX"}
        {type === "discover" && "DISC"}
      </span>
    </div>
  );
}
