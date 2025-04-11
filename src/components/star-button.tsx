"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarButtonProps {
  owner: string;
  repository: string;
  initialStarred: boolean;
  stargazerCount: number;
}

export function StarButton({
  owner,
  repository,
  initialStarred,
  stargazerCount,
}: StarButtonProps) {
  const [isStarred, setIsStarred] = useState(initialStarred);
  const [count, setCount] = useState(stargazerCount);
  const utils = api.useUtils();

  const { mutate: toggleStar, isLoading } = api.github.toggleStar.useMutation({
    onSuccess: (data) => {
      setIsStarred(data.isStarred);
      setCount((prev) => (data.isStarred ? prev + 1 : prev - 1));
      utils.github.getRepositoryOverview.invalidate({ owner, repository });
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleStar({ owner, repository })}
      disabled={isLoading}
      className={cn("gap-2", isStarred && "bg-accent")}
    >
      <Star className={cn("h-4 w-4", isStarred && "fill-current")} />
      <span>{isStarred ? "Starred" : "Star"}</span>
      <span className="text-xs">({count})</span>
    </Button>
  );
}
