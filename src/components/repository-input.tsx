"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

export function RepositoryInput() {
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    let path = "" as string | undefined;
    const formData = new FormData(e.target as HTMLFormElement);
    const rawRepoInput = formData.get("repoInput");

    const repoInputSchema = z.string();
    const result = repoInputSchema.safeParse(rawRepoInput);

    if (!result.success) {
      console.log(result.error);
      setError("Invalid repository URL format");
      return;
    }
    const repoInput = result.data;

    if (repoInput.includes("github.com")) {
      path = repoInput.split("github.com/")[1];
    } else if (repoInput.includes("/")) {
      path = repoInput;
    } else {
      setError(
        "Invalid repository format. Please use 'owner/repo' or a full GitHub URL"
      );
      return;
    }

    if (path) {
      router.push(`/${path}/tree/main`);
    } else {
      setError("Invalid GitHub repository URL format");
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <></>;
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter GitHub repository URL or name (e.g., owner/repo)"
            className={`flex-1 ${error ? "border-red-500" : ""}`}
            aria-invalid={error ? "true" : "false"}
            name="repoInput"
          />
          <Button type="submit">Load</Button>
        </div>
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
