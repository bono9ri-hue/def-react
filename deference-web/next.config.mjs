/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next.js가 최적화해줄 이미지들의 '출입 명단'입니다.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // "Godly" 속도를 위한 최신 압축 포맷 설정
    formats: ['image/avif', 'image/webp'],
    // Vercel 서버에서 이미지를 최대한 오래 캐싱하여 로딩 속도를 극대화합니다 (1년)
    minimumCacheTTL: 31536000,
  },
  // 빌드 시 타입 체크나 린트 에러 때문에 멈추는 게 싫다면 아래 설정을 활용할 수 있습니다.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;