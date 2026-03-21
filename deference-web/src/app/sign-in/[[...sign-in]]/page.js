import { SignIn } from "@clerk/nextjs";

export const generateStaticParams = () => {
  return [{ 'sign-in': [] }];
};

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignIn />
    </div>
  );
}
