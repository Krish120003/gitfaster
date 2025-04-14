"use client";

import { type RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarButtonProps {
  owner: string;
  repository: string;
}

export default function StarButton({ owner, repository }: StarButtonProps) {
  const { data: starInfo, isLoading } = api.github.getStarInfo.useQuery(
    {
      owner,
      repository,
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const utils = api.useUtils();

  const { mutate: setStar } = api.github.setStar.useMutation({
    async onMutate({ value }) {
      // Cancel outgoing fetches
      await utils.github.getStarInfo.cancel({ owner, repository });

      // Get the current data
      const prevData = utils.github.getStarInfo.getData({ owner, repository });

      // Optimistically update
      utils.github.getStarInfo.setData({ owner, repository }, (old) => ({
        ...old!,
        viewerHasStarred: value,
        stargazerCount: (old?.stargazerCount ?? 0) + (value ? 1 : -1),
      }));

      return { prevData };
    },
    onError(err, newData, ctx) {
      // If the mutation fails, revert the optimistic update
      utils.github.getStarInfo.setData({ owner, repository }, ctx?.prevData);
    },
    onSettled() {
      // Sync with server
      utils.github.getStarInfo.invalidate({ owner, repository });
    },
  });

  const toggleStar = () => {
    setStar({ owner, repository, value: !starInfo?.viewerHasStarred });
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Star className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleStar}
      className="gap-2 min-w-[80px] cursor-pointer"
    >
      <Star
        className={cn(
          `h-4 w-4`,
          starInfo?.viewerHasStarred && "fill-yellow-400 stroke-yellow-400"
        )}
      />
      <span>{starInfo?.stargazerCount ?? 0}</span>
    </Button>
  );
}
