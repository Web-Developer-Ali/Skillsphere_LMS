"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo, Plus, Trash2 } from "lucide-react"

interface CourseSkillsProps {
  skills: string
  updateCourseField: (field: string, value: string) => Promise<void>
}

export default function CourseSkills({ skills, updateCourseField }: CourseSkillsProps) {
  const [skillArray, setSkillArray] = useState<string[]>(skills ? skills.split(",").map((skill) => skill.trim()) : [])
  const [newSkill, setNewSkill] = useState("")

  const addSkill = useCallback(async () => {
    if (newSkill.trim()) {
      const updatedSkills = [...skillArray, newSkill.trim()]
      await updateCourseField("Skills", updatedSkills.join(", "))
      setSkillArray(updatedSkills)
      setNewSkill("")
    }
  }, [newSkill, skillArray, updateCourseField])

  const removeSkill = useCallback(
    async (skillToRemove: string) => {
      const updatedSkills = skillArray.filter((skill) => skill !== skillToRemove)
      await updateCourseField("Skills", updatedSkills.join(", "))
      setSkillArray(updatedSkills)
    },
    [skillArray, updateCourseField],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-xl font-semibold dark:text-white">
        <ListTodo className="h-6 w-6 text-blue-500 dark:text-blue-400" />
        <h2>Course Skills</h2>
      </div>

      <Card className="shadow-md dark:bg-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center justify-between flex-wrap gap-2 dark:text-white">
            <span className="text-base sm:text-lg">Add New</span>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="New skill"
                className="w-40 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addSkill}
                className="dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {skillArray.length > 0 ? (
            <ul className="space-y-2">
              {skillArray.map((skill, index) => (
                <li key={index} className="flex items-center justify-between dark:text-gray-200">
                  <span>{skill}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkill(skill)}
                    className="dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600"
                  >
                    <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-gray-400">No skills added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

