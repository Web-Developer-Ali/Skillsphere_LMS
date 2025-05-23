"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CreatePostDialogProps {
  isReply?: boolean
  replyToPost?: {
    id: number
    title: string
    author: string
  }
  onPostCreated?: (post: {
    title: string
    message: string
    tags: string[]
    replyToId?: number
  }) => void
}

export default function CreatePostDialog({ isReply = false, replyToPost, onPostCreated }: CreatePostDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [postTitle, setPostTitle] = useState("")
  const [postMessage, setPostMessage] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const handleCreatePost = () => {
    // Validate inputs
    if ((!isReply && !postTitle.trim()) || !postMessage.trim()) {
      return // Don't submit if required fields are empty
    }

    // Handle post creation logic here
    const newPost = {
      title: isReply ? replyToPost?.title || "" : postTitle,
      message: postMessage,
      tags: tags,
      replyToId: isReply ? replyToPost?.id : undefined,
    }

    console.log("Post created:", newPost)

    if (onPostCreated) {
      onPostCreated(newPost)
    }

    // Reset form fields
    setPostTitle("")
    setPostMessage("")
    setTags([])

    // Close the dialog
    setIsDialogOpen(false)
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className={`${isReply ? "w-auto" : "w-full"} dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:border-gray-600`}
        >
          <MessageSquare className="mr-2 h-4 w-4 dark:text-gray-200" />
          {isReply ? "Reply" : "Create Post"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            {isReply ? `Reply to ${replyToPost?.title}` : "Create a New Post"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {isReply
              ? `Reply to ${replyToPost?.author}'s post.`
              : "Share your thoughts, questions, or ideas with the community."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!isReply && (
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <Input
                id="title"
                placeholder="Enter a title for your post"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600"
              />
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Write your message here"
              rows={5}
              value={postMessage}
              onChange={(e) => setPostMessage(e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="tags" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTag}
                className="dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 rounded-full dark:bg-gray-700 dark:text-gray-100"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 rounded-full hover:bg-gray-600 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            className="text-gray-700 dark:text-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleCreatePost}
            className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isReply ? "Reply" : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
