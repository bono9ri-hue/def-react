import {
  LayoutGrid,
  FolderOpen,
  Settings,
  PlusCircle,
  LogOut,
  User
} from "lucide-react";

/**
 * Single Source of Truth (SSOT) for Navigation Data
 * Used by `<AppSidebar>` (Desktop) and `<MobileBottomBar>` (Mobile)
 */
export const navigationData = {
  // Mock User Data (to be replaced with Clerk auth payload if needed)
  user: {
    name: "User",
    email: "user@deference.com",
    avatar: "", // empty fallbacks to initials
  },

  // Main Action (FAB on mobile, Top button on desktop)
  mainAction: {
    title: "Upload",
    icon: PlusCircle,
    actionId: "upload-modal",
  },

  // Primary Navigation Links
  navMain: [
    {
      title: "All Assets",
      url: "/home",
      icon: LayoutGrid,
      isActive: true,
    },
    {
      title: "Collections",
      url: "/home/collections",
      icon: FolderOpen,
      isActive: false,
    },
  ],

  // Secondary Settings/Profile Links
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Logout",
      url: "#logout",
      icon: LogOut,
    }
  ],

  // Collections (Folder Tree mapping for NavProjects)
  collections: [
    {
      name: "Design Engineering",
      url: "#",
      icon: FolderOpen,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: FolderOpen,
    },
  ],
};
