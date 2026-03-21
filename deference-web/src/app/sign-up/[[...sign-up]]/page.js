import { SignUp } from "@clerk/nextjs";

export const generateStaticParams = () => {
  return [{ 'sign-up': [] }];
};

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignUp />
    </div>
  );
}
