import AssetGrid from "@/components/dashboard/AssetGrid";

export default function DashboardPage() {
  return (
    <div className="flex-1 w-full p-4 md:p-8">
      {/* 대시보드 헤더 영역 */}
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">All References</h1>
        <p className="text-muted-foreground text-sm">
          수집된 모든 디자인 레퍼런스를 한눈에 확인하세요.
        </p>
      </div>
      
      {/* 갤러리 섹션 */}
      <AssetGrid />
    </div>
  );
}
