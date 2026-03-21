import { Show, SignInButton } from "@clerk/nextjs";
import Dashboard from "../components/DashboardContainer";
import { ToastProvider } from "../components/Toast";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#111111] text-white">
      <Show when="signed-out">
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
          <SignInButton mode="modal">
            <button className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        <ToastProvider>
          <Dashboard />
        </ToastProvider>
      </Show>
    </main>
  );
}
