"use client";

import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Search,
  Plus,
  Bell,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  MoreHorizontal,
  Home
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useClerk, UserProfile, SignInButton, SignUpButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

/**
 * TopHeader - Absolute Centering "Dock" Layout (Style-Preserved)
 * strictly preserves original component classes/props while re-orienting structure.
 */
export function TopHeader() {
  const { toggleSidebar } = useSidebar();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-[52px] w-full bg-transparent md:bg-background/95 md:backdrop-blur-sm shrink-0">
      
      {/* 1. Left Area: Sidebar Trigger (flex-1 flex justify-start) */}
      <div className="flex-1 flex items-center justify-start min-w-0">
        <Button 
          variant="secondary" 
          size="icon"
          className="flex-shrink-0 rounded-full !ring-0 !outline-none p-0 transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      {/* 2. Center Area: Centralized Actions Group (flex flex-center gap-2) */}
      <div className="flex items-center justify-center gap-2">
        {/* [Home 버튼] */}
        <Link href="/home">
          <Button 
            variant="secondary" 
            size="icon"
            className="flex-shrink-0 rounded-full !ring-0 !outline-none p-0 transition-colors"
          >
            <Home className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </Link>

        {/* [Search 버튼] - Icon only triggered Command Dialog */}
        <Button 
          variant="secondary" 
          size="icon"
          className="flex-shrink-0 rounded-full !ring-0 !outline-none p-0 transition-colors"
          onClick={() => setOpen(true)}
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </Button>

        {/* [Upload 버튼] */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Add new space"
              variant="secondary"
              size="icon"
              className="flex-shrink-0 rounded-full !ring-0 !outline-none p-0 transition-colors"
            >
              <Plus className="!h-5 !w-5" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()} className="w-56 border border-border bg-popover shadow-md outline-none focus:outline-none">
            <DropdownMenuLabel>Upload Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Upload Files</DropdownMenuItem>
            <DropdownMenuItem>New Collection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* [Notification 버튼] */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Notifications"
              variant="secondary"
              size="icon"
              className="relative flex-shrink-0 rounded-full !ring-0 !outline-none p-0 transition-colors"
            >
              <Bell className="h-4 w-4" strokeWidth={1.5} />
              <span className="absolute top-[2.5px] right-[2.5px] flex !h-1.5 !w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full !h-1.5 !w-1.5 bg-red-500"></span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px] border border-border bg-popover shadow-md outline-none focus:outline-none" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* [유저 아바타] */}
        {!isLoaded ? (
          <Skeleton className="w-10 h-10 flex-shrink-0 rounded-full" />
        ) : isSignedIn ? (
          <Link href="/profile">
            <Button
              variant="secondary"
              size="icon"
              className="flex-shrink-0 rounded-full flex items-center justify-center p-0 focus-visible:ring-0 overflow-hidden relative !ring-0 !outline-none transition-colors"
            >
              <Avatar className="w-full h-full shrink-0 rounded-none pointer-events-none">
                <AvatarImage
                  src={clerkUser?.imageUrl}
                  alt={clerkUser?.fullName || "User"}
                  className="object-cover w-full h-full rounded-full"
                />
                <AvatarFallback className="bg-muted animate-pulse" />
              </Avatar>
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="h-9 font-medium">In</Button>
            </SignInButton>
          </div>
        )}
      </div>

      {/* 3. Right Area: More Actions (flex-1 flex justify-end) */}
      <div className="flex-1 flex items-center justify-end min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="View Controls & Settings"
              variant="secondary"
              size="icon"
              className="flex-shrink-0 rounded-full !ring-0 !outline-none p-0 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-border bg-popover shadow-md outline-none focus:outline-none">
            <DropdownMenuLabel>View & Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="flex items-center justify-between py-2 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
                <span className="text-sm font-medium">Theme</span>
                <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                  <button onClick={() => setTheme("light")} className={`rounded-full p-1.5 transition-all ${theme === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setTheme("dark")} className={`rounded-full p-1.5 transition-all ${theme === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setTheme("system")} className={`rounded-full p-1.5 transition-all ${theme === "system" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => openUserProfile()}>
                <User className="mr-2 h-4 w-4" />
                <span>Manage Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>App Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Command Dialog & Mobile Nav remain original */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border w-full">
          <CommandInput placeholder="Search collections, assets, folders..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Quick Actions">
              <CommandItem>
                <Plus className="mr-2 h-4 w-4" />
                <span>New Collection</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="w-auto max-w-none flex justify-center p-0 border-none bg-transparent shadow-none outline-none [&>button]:hidden">
          <DialogTitle className="sr-only">User Profile Settings</DialogTitle>
          <DialogDescription className="sr-only">Manage your account settings and preferences.</DialogDescription>
          <UserProfile
            routing="hash"
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                rootBox: "mx-auto w-full",
                cardBox: "shadow-none border-none rounded-xl bg-background",
                navbar: "border-none bg-background",
                scrollBox: "border-none bg-background rounded-none",
                navbarButton: "text-muted-foreground hover:bg-muted hover:text-foreground",
                headerTitle: "text-foreground font-semibold",
                headerSubtitle: "text-muted-foreground",
                profileSectionTitleText: "text-foreground font-medium",
                profileSectionPrimaryButton: "text-primary hover:bg-muted",
                dividerRow: "border-border",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
                formFieldInput: "bg-background border-input text-foreground rounded-md focus:ring-ring"
              }
            }}
          />
        </DialogContent>
      </Dialog>
      
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-6 px-6 h-16 w-max max-w-[calc(100%-2rem)] rounded-full bg-background/80 backdrop-blur-xl border border-border shadow-lg overflow-hidden">
        <Link href="/home" className="flex-1 max-w-[48px]">
          <Button 
            variant="ghost" 
            size="icon-lg" 
            className="w-full rounded-full !ring-0 min-w-0 shrink transition-all duration-300"
          >
            <Home className="!h-6 !w-6 text-muted-foreground" />
          </Button>
        </Link>

        <Button 
          variant="ghost" 
          size="icon-lg" 
          className="flex-1 max-w-[48px] rounded-full !ring-0 min-w-0 shrink transition-all duration-300" 
          onClick={() => setOpen(true)}
        >
          <Search className="!h-6 !w-6 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon-lg" 
              className="flex-1 max-w-[48px] rounded-full !ring-0 min-w-0 shrink transition-all duration-300"
            >
              <Plus className="!h-6 !w-6 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" sideOffset={20} className="w-56 border border-border bg-popover shadow-md outline-none focus:outline-none">
            <DropdownMenuLabel>Upload Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Upload Files</DropdownMenuItem>
            <DropdownMenuItem>New Collection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon-lg" 
              className="flex-1 max-w-[48px] rounded-full !ring-0 min-w-0 shrink transition-all duration-300"
            >
              <div className="relative">
                <Bell className="!h-6 !w-6 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 !h-2.5 !w-2.5 rounded-full bg-red-500 border-2 border-background" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" sideOffset={20} className="w-[300px] border border-border bg-popover shadow-md outline-none focus:outline-none">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="icon-lg" 
          className="flex-1 max-w-[48px] rounded-full !ring-0 p-0 min-w-0 shrink transition-all duration-300" 
          onClick={() => setIsProfileOpen(true)}
        >
          <Avatar className="w-full h-full shrink-0">
            <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.fullName || "User"} />
            <AvatarFallback className="bg-muted animate-pulse" />
          </Avatar>
        </Button>
      </nav>
    </header>
  );
}