import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { TopHeader } from "@/components/top-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata = {
  title: "Deference - SaaS Dashboard",
  description: "Clean Canvas SaaS Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorBackground: "#000000",
          colorInputBackground: "#1a1a1a",
          colorInputText: "#ffffff",
          colorTextOnPrimaryBackground: "#000000",
          colorText: "#ffffff"
        },
      }}
    >
      <html lang="ko" suppressHydrationWarning>
        <body className="font-sans antialiased selection:bg-primary/20 bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <Providers>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset className="flex flex-col w-full h-screen overflow-hidden">
                    <TopHeader />
                    <main className="flex-1 overflow-hidden bg-background p-0 md:pb-0 pb-[env(safe-area-inset-bottom)]">
                      <ScrollArea className="h-full w-full">
                        {children}
                      </ScrollArea>
                    </main>
                  </SidebarInset>
                </SidebarProvider>
              </Providers>
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}