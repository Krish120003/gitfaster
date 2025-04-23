"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { GitBranchIcon, Github } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";

interface SignInRedirectProps {
  owner: string;
  repository: string;
}

export function SignInRedirect({ owner, repository }: SignInRedirectProps) {
  useEffect(() => {
    const currentPath = `/${owner}/${repository}`;
    signIn("github", { redirectTo: currentPath });
  }, [owner, repository]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center justify-center w-32 h-full gap-2 border-r">
            <GitBranchIcon className="h-4 w-4 text-[#f0883e]" />
            <span className="text-sm font-medium">gitfaster</span>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center flex-1 gap-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-6">
            <Github className="w-16 h-16 text-foreground opacity-80" />
          </div>
          <h2 className="text-2xl font-semibold">Redirecting to GitHub</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Please wait while we redirect you to GitHub to authorize access to
            the repository{" "}
            <span className="font-semibold">
              {owner}/{repository}
            </span>
          </p>
        </div>
        <LoadingSpinner />
      </main>
    </div>
  );
}
