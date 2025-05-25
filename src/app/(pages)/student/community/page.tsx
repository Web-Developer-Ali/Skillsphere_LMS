"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ContributorSkeleton,
  PostSkeleton,
  TagsSkeleton,
} from "@/components/students_components/community/loading-skeleton";
import CreatePostDialog from "@/components/students_components/community/CreatePostDialog";
import { formatDistanceToNow } from "date-fns";

// Types for the API response
interface ApiPost {
  PostID: number;
  AuthorID: number;
  ParentPostID: number | null;
  Title: string;
  Content: string;
  Tags: string[];
  LikeCount: number;
  ReplyCount: number;
  ViewCount: number;
  IsPinned: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  ExpiresAt: string;
  // Add any other fields from your API
  Author?: {
    Name: string;
    Avatar: string;
    Role: string;
  };
}

// Types for the component
interface Post {
  id: number;
  title: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    id: number; // Added author ID for tracking
  };
  replies: number;
  likes: number;
  likedByCurrentUser: boolean;
  timeAgo: string;
  preview: string;
  tags: string[];
}

interface Contributor {
  id: number;
  name: string;
  avatar: string;
  contributions: number;
  role: string;
}

export default function CommunityPage() {
  // State
  const [discussions, setDiscussions] = useState<Post[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingContributors, setIsLoadingContributors] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Convert API post format to component post format
  const mapApiPostToComponentPost = (apiPost: ApiPost): Post => {
    return {
      id: apiPost.PostID,
      title: apiPost.Title,
      author: {
        id: apiPost.AuthorID,
        name: apiPost.Author?.Name || `User ${apiPost.AuthorID}`,
        avatar: apiPost.Author?.Avatar || "/placeholder.svg",
        role: apiPost.Author?.Role || "Student",
      },
      replies: apiPost.ReplyCount,
      likes: apiPost.LikeCount,
      likedByCurrentUser: false, // You'll need to implement this based on your API
      timeAgo: formatDistanceToNow(new Date(apiPost.CreatedAt), {
        addSuffix: true,
      }),
      preview:
        apiPost.Content.substring(0, 150) +
        (apiPost.Content.length > 150 ? "..." : ""),
      tags: apiPost.Tags || [],
    };
  };

  // Calculate top contributors from posts data
  const calculateTopContributors = (posts: Post[]): Contributor[] => {
    // Create a map to count posts by each author
    const authorPostCounts = new Map<
      number,
      {
        count: number;
        name: string;
        avatar: string;
        role: string;
      }
    >();

    // Count posts by each author
    posts.forEach((post) => {
      const authorId = post.author.id;
      if (authorPostCounts.has(authorId)) {
        const currentData = authorPostCounts.get(authorId)!;
        authorPostCounts.set(authorId, {
          ...currentData,
          count: currentData.count + 1,
        });
      } else {
        authorPostCounts.set(authorId, {
          count: 1,
          name: post.author.name,
          avatar: post.author.avatar,
          role: post.author.role,
        });
      }
    });

    // Convert map to array and sort by post count (descending)
    const sortedContributors = Array.from(authorPostCounts.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        avatar: data.avatar,
        contributions: data.count,
        role: data.role,
      }))
      .sort((a, b) => b.contributions - a.contributions);

    // Return top 5 contributors (or fewer if there aren't 5)
    return sortedContributors.slice(0, 5);
  };

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setIsLoadingContributors(true);
    setError(null);
    try {
      const response = await fetch("/api/student/community/getPosts");
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
  
      const data = await response.json();
      const postsArray = Array.isArray(data) ? data : data.posts;
  
      if (!postsArray) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
  
      const mappedPosts = postsArray.map(mapApiPostToComponentPost);
      setDiscussions(mappedPosts);
  
      const allTags = postsArray.flatMap(
        (post: { Tags: string[] }) => post.Tags || []
      );
      const uniqueTags = Array.from(new Set(allTags)) as string[];
      setPopularTags(uniqueTags);
  
      const contributors = calculateTopContributors(mappedPosts);
      setTopContributors(contributors);
      setIsLoadingContributors(false);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPosts(false);
      setIsLoadingStats(false);
    }
  }, [toast]); 

  // Initial data fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle post creation
  const handlePostCreated = async (post: {
    title: string;
    message: string;
    tags: string[];
    replyToId?: number;
  }) => {
    try {
      // Map to API format
      const apiPost = {
        Title: post.title,
        Content: post.message,
        Tags: post.tags,
        ParentPostID: post.replyToId || null,
      };

      const response = await fetch("/api/student/community/Create_Post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPost),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      // Refresh posts after creating a new one
      fetchPosts();

      toast({
        title: "Success",
        description: post.replyToId
          ? "Your reply has been posted!"
          : "Your post has been created!",
      });
    } catch (err) {
      console.error("Error creating post:", err);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <div className="min-h-screen max-w-[100vw] overflow-x-hidden">
        <div className="min-h-screen px-4 py-4 md:py-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Community
              </h1>
              <p className="text-sm md:text-base text-muted-foreground dark:text-gray-400">
                Connect, learn, and grow with fellow learners
              </p>
            </div>
            <div>
              <CreatePostDialog onPostCreated={handlePostCreated} />
            </div>
          </div>

          {/* Main Content */}
          <div className=" grid gap-6 lg:grid-cols-[1fr,300px]">
            {/* Posts/Discussions */}
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Posts */}
              <div className="space-y-4">
                {isLoadingPosts ? (
                  // Loading skeletons
                  Array(3)
                    .fill(0)
                    .map((_, index) => <PostSkeleton key={index} />)
                ) : discussions.length === 0 ? (
                  // No posts found
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground dark:text-gray-400">
                        No posts found. Be the first to create one!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  // Posts list
                  discussions.map((discussion) => (
                    <Card
                      key={discussion.id}
                      className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden"
                    >
                      <CardHeader className="p-4 md:p-6">
                        <div className="flex items-start gap-3">
                          <Avatar className="hidden sm:flex h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                            <AvatarImage
                              src={
                                discussion.author.avatar || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback>
                              {discussion.author.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <CardTitle className="text-base md:text-lg dark:text-gray-100 break-words">
                              {discussion.title}
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm dark:text-gray-400">
                              Posted by {discussion.author.name} ·{" "}
                              {discussion.timeAgo}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 md:px-6">
                        <p className="text-sm text-muted-foreground dark:text-gray-400 break-words">
                          {discussion.preview}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {discussion.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs rounded-full dark:border-gray-700 dark:text-gray-100"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Top Contributors */}
              <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">
                    Top Contributors
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Most active community members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingContributors ? (
                    Array(3)
                      .fill(0)
                      .map((_, index) => <ContributorSkeleton key={index} />)
                  ) : topContributors.length === 0 ? (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      No contributors yet
                    </p>
                  ) : (
                    topContributors.map((contributor) => (
                      <div
                        key={contributor.id}
                        className="flex items-center gap-4"
                      >
                        <Avatar className="flex-shrink-0">
                          <AvatarImage
                            src={contributor.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium dark:text-gray-100 truncate">
                            {contributor.name}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400 truncate">
                            {contributor.role}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400 whitespace-nowrap">
                          {contributor.contributions}{" "}
                          {contributor.contributions === 1 ? "post" : "posts"}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Popular Tags */}
              <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">
                    Popular Tags
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Trending topics in the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <TagsSkeleton />
                  ) : popularTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      No tags yet
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-full dark:bg-gray-700 dark:text-gray-100"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
