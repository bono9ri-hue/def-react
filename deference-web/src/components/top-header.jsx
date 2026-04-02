"use client";

import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, Plus, Bell, LogOut, Settings, User, Search, Sun, Moon, Monitor, LayoutGrid, Rows2, Columns2, Columns3, Menu } from "lucide-react";
import { navigationData } from "@/config/navigation";
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
  CommandShortcut,
} from "@/components/ui/command";

export function TopHeader() {
  const { toggleSidebar } = useSidebar();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isMac, setIsMac] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    setIsMac(navigator.userAgent.toUpperCase().indexOf("MAC") >= 0);

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
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between px-4 bg-transparent md:bg-background/95 md:backdrop-blur-sm shrink-0">
      {/* Left Area: Sidebar Toggle (Hamburger Menu) */}
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="!h-9 !w-9 rounded-full !ring-0 !outline-none" onClick={toggleSidebar}>
          <Menu className="h-5 w-5 text-foreground" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      {/* Center Area: Global Search Trigger */}
      <div className="hidden md:flex flex-1 items-center justify-center px-4 max-w-md mx-auto">
        <Button
          variant="outline"
          className="relative h-9 w-full justify-start rounded-[0.5rem] bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground shadow-sm sm:pr-12 md:w-full transition-colors !ring-0 !outline-none"
          onClick={() => setOpen(true)}
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="hidden lg:inline-flex">Search collections and assets...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            {mounted ? (isMac ? "⌘K" : "Ctrl+K") : "⌘K"}
          </kbd>
        </Button>
      </div>

      {/* Right Area: Utility Actions (Desktop Only - Decoupled for Blinking Prevention) */}
      <div className="hidden md:flex items-center gap-2">
        {/* 1. 인증 상태와 무관하게 즉시 렌더링되는 고정 UI (깜빡임 완벽 제거) */}
        {/* [Upload 버튼 (+)] */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Add new space" variant="ghost" size="icon" className="!h-9 !w-9 rounded-full !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none">
              <Plus className="!h-5 !w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()} className="w-56 border border-border bg-popover shadow-md outline-none focus:outline-none">
            <DropdownMenuLabel>Upload Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Upload Files</DropdownMenuItem>
            <DropdownMenuItem>New Collection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* [Notification 버튼 (알림 + 빨간점)] */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Notifications" variant="ghost" size="icon" className="relative !h-9 !w-9 rounded-full !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none">
              <Bell className="!h-5 !w-5 text-muted-foreground" />
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

        <div className="w-[1px] h-4 bg-border mx-2" />

        {/* 2. 인증 상태에 따라 동적으로 변하는 유저 UI (Avatar/SignIn) */}
        {!isLoaded ? (
          <Skeleton className="h-9 w-9 rounded-full" />
        ) : isSignedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative !h-9 !w-9 rounded-full p-0 !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.fullName || "User"} />
                  <AvatarFallback className="bg-muted animate-pulse" />
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border border-border bg-popover shadow-md outline-none focus:outline-none">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{clerkUser?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
              <DropdownMenuItem className="flex items-center justify-between py-2 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
                <span className="text-sm font-medium">Grid size</span>
                <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                  <button className="rounded-full bg-background px-3 py-1 text-[11px] font-bold text-foreground shadow-sm">
                    II
                  </button>
                  <button className="rounded-full px-3 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                    III
                  </button>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="h-9">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
            </SignUpButton>
          </div>
        )}
      </div>

      {/* [Clerk UserProfile Modal] */}
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

      {/* [Command Palette Modal] */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md w-full">
          <CommandInput placeholder="Search collections, assets, folders..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Recent Searches">
              <CommandItem>
                <Search className="mr-2 h-4 w-4" />
                <span>UI Layouts</span>
              </CommandItem>
              <CommandItem>
                <Search className="mr-2 h-4 w-4" />
                <span>Landing Pages</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem>
                <Plus className="mr-2 h-4 w-4" />
                <span>New Collection</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      {/* Mobile Bottom Floating Bar (Improved Synergy & Organic Scaling) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-6 px-6 h-16 w-max max-w-[calc(100%-2rem)] rounded-full bg-background/80 backdrop-blur-xl border border-border shadow-lg overflow-hidden">
        <Button variant="ghost" size="icon" className="flex-1 max-w-[48px] h-12 rounded-full !ring-0 min-w-0 shrink transition-all duration-300">
          <Home className="!h-6 !w-6 text-muted-foreground" />
        </Button>

        <Button variant="ghost" size="icon" className="flex-1 max-w-[48px] h-12 rounded-full !ring-0 min-w-0 shrink transition-all duration-300" onClick={() => setOpen(true)}>
          <Search className="!h-6 !w-6 text-muted-foreground" />
        </Button>

        <Button variant="ghost" size="icon" className="flex-1 max-w-[48px] h-12 rounded-full !ring-0 min-w-0 shrink transition-all duration-300">
          <Plus className="!h-6 !w-6 text-muted-foreground" />
        </Button>

        <Button variant="ghost" size="icon" className="flex-1 max-w-[48px] h-12 rounded-full !ring-0 min-w-0 shrink transition-all duration-300">
          <div className="relative">
            <Bell className="!h-6 !w-6 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 !h-2.5 !w-2.5 rounded-full bg-red-500 border-2 border-background" />
          </div>
        </Button>

        <Button variant="ghost" size="icon" className="flex-1 max-w-[48px] h-12 rounded-full !ring-0 p-0 min-w-0 shrink transition-all duration-300" onClick={() => setIsProfileOpen(true)}>
          <Avatar className="!h-9 !w-9 shrink-0">
            <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.fullName || "User"} />
            <AvatarFallback className="bg-muted animate-pulse" />
          </Avatar>
        </Button>
      </nav>
    </header>
  );
}
