"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, PenLine } from "lucide-react"
import { z } from "zod"

interface CoursePriceProps {
  fees: number
  updateCourseField: (field: string, value: number) => Promise<void>
}

// Define Zod schema for price validation
const priceSchema = z
  .number()
  .min(0, { message: "Price must be at least 0" })
  .max(99999.99, { message: "Price cannot exceed 99,999.99" }) // Adjust max if needed
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
    message: "Price must have at most two decimal places",
  })

export default function CoursePrice({ fees, updateCourseField }: CoursePriceProps) {
  const [price, setPrice] = useState(fees)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdatePrice = useCallback(async () => {
    const parsed = priceSchema.safeParse(price)

    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }

    setError(null)
    await updateCourseField("Fees", price)
    setIsEditingPrice(false)
  }, [price, updateCourseField])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-xl font-semibold dark:text-white">
        <DollarSign className="h-6 w-6 text-blue-500 dark:text-blue-400" />
        <h2>Sell your course</h2>
      </div>

      <Card className="shadow-md dark:bg-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center justify-between dark:text-white">
            Course price
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingPrice(!isEditingPrice)}
              className="dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600"
            >
              <PenLine className="h-4 w-4 mr-2" />
              {isEditingPrice ? "Cancel" : "Edit price"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isEditingPrice ? (
            <div className="flex flex-col gap-2">
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="Enter course price"
                className="flex-grow dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={handleUpdatePrice} className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
                Update
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-gray-300">{fees ? `$${fees}` : "No price set"}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
