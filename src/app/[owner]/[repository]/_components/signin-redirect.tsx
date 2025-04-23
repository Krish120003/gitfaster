"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

interface SignInRedirectProps {
  owner: string;
  repository: string;
}

export function SignInRedirect({ owner, repository }: SignInRedirectProps) {
  useEffect(() => {
    const currentPath = `/${owner}/${repository}`;
    signIn("github", { callbackUrl: currentPath });
  }, [owner, repository]);

  return <></>;
}
