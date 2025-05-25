import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Lock, LogOut, User } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background dark:bg-gray-900">
      {/* Main Content */}
      <main className="flex-1">
        <div className="container max-w-6xl py-6 px-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Settings
            </h1>
            <p className="text-muted-foreground dark:text-gray-400">
              Manage your account settings and preferences.
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="dark:bg-gray-800">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 dark:text-gray-100 dark:data-[state=active]:bg-gray-700"
              >
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="flex items-center gap-2 dark:text-gray-100 dark:data-[state=active]:bg-gray-700"
              >
                <Lock className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">
                    Profile Information
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Update your profile information and photo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 overflow-hidden rounded-full">
                        <Image
                          src="https://randomuser.me/api/portraits/men/32.jpg"
                          alt="Profile"
                          className="object-cover"
                          fill
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Upload photo</span>
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium dark:text-gray-100">
                        Profile Photo
                      </h4>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Upload a new profile photo.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="dark:text-gray-100">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        defaultValue="Alex"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="dark:text-gray-100">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        defaultValue="Johnson"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-100">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        defaultValue="alex@example.com"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="dark:text-gray-100">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="bio" className="dark:text-gray-100">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Write a short bio about yourself"
                        className="min-h-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        defaultValue="Learning enthusiast passionate about web development and design."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">
                    Account Security
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Manage your password and account security settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="dark:text-gray-100"
                      >
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="dark:text-gray-100"
                      >
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="dark:text-gray-100"
                      >
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium dark:text-gray-100">
                      Two-Factor Authentication
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="dark:text-gray-100">Enable 2FA</Label>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          Add an extra layer of security to your account.
                        </p>
                      </div>
                      <Switch className="dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">
                    Connected Accounts
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Manage your connected social accounts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {["Google", "GitHub", "LinkedIn"].map((account) => (
                    <div
                      key={account}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <Label className="dark:text-gray-100">{account}</Label>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          {account === "Google" ? "Connected" : "Not connected"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
                      >
                        {account === "Google" ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-destructive dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-destructive dark:text-red-500">
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Irreversible and destructive actions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="dark:text-gray-100">
                        Delete Account
                      </Label>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                    <Button variant="destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
