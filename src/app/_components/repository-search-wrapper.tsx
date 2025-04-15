"use client";

import { useRouter } from "next/navigation";
import { RepositorySearch } from "./repository-search";
import type { Repository } from "@/server/api/routers/user";

export function RepositorySearchWrapper() {
  const router = useRouter();

  const handleRepositorySelect = (repo: Repository) => {
    router.push(`/${repo.owner.login}/${repo.name}`);
  };

  return (
    <div className="p-4 border-b">
      <h2 className="text-lg font-medium mb-2">Search repositories</h2>
      <RepositorySearch onSelect={handleRepositorySelect} />
    </div>
  );
}
