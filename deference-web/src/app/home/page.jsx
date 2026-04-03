import AssetGrid from "@/components/dashboard/AssetGrid";
import { FaviconBar } from "@/components/favicon-bar";

export default function HomePage() {
  return (
    <div className="flex-1 w-full pb-10">
      <main className="flex flex-col gap-4 md:gap-6 w-full">
        {/* 대시보드 헤더 영역: Centered Favicon Bookmark Bar (Title Removed) */}
        <div className="flex items-center justify-center h-[52px] w-full">
          <div className="hidden md:block w-full max-w-2xl">
            <FaviconBar />
          </div>
        </div>
        
        {/* 갤러리 섹션 */}
        <AssetGrid />
      </main>
    </div>
  );
}
