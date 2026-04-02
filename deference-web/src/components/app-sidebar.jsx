"use client";

import * as React from "react";
import { ChevronRight, FolderClosed, LayoutGrid, MoreHorizontal, Plus } from "lucide-react";
import { navigationData } from "@/config/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function AppSidebar({ ...props }) {
  const { collections, navMain } = navigationData;

  return (
    <Sidebar collapsible="offcanvas" className="!border-none" {...props}>
      <SidebarHeader>
        <div className="flex items-center h-8 px-2 group-data-[collapsible=icon]:hidden">
          <span className="font-bold tracking-tight text-lg">Deference</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Collections Tree (Group-Folder Hierarchy) */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex w-full items-center justify-between pr-2 text-muted-foreground/70">
            <span>Collections</span>
            <button 
              title="Add Collection" 
              className="shrink-0 transition-colors hover:text-sidebar-foreground cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </SidebarGroupLabel>
          <SidebarMenu>
            {collections.map((collection) => (
              <Collapsible
                key={collection.name}
                asChild
                defaultOpen
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={collection.name} className="relative w-full">
                      {/* Visual Group: No icon, just text + chevron */}
                      <span className="font-medium text-sidebar-foreground/70">{collection.name}</span>
                      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="border-none px-0 mx-0 pl-3">
                      {/* Real Folder with Context Menu */}
                      <SidebarMenuSubItem className="relative w-full group/item">
                        <SidebarMenuSubButton asChild className="w-full">
                          <Link href={collection.url}>
                            <FolderClosed className="w-4 h-4 text-sidebar-foreground/70" />
                            <span>All References</span>
                          </Link>
                        </SidebarMenuSubButton>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 data-[state=open]:opacity-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            side="right" 
                            align="start" 
                            className="w-48 border border-border bg-popover shadow-md outline-none focus:outline-none"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <DropdownMenuItem>Share Folder</DropdownMenuItem>
                            <DropdownMenuItem>Rename</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
