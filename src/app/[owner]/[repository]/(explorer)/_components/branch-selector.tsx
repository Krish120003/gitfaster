"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch } from "lucide-react";

export function BranchSelector() {
  const params = useParams<{
    owner: string;
    repository: string;
    branch: string;
  }>();
  const router = useRouter();
  const pathname = usePathname();

  const { owner, repository, branch: currentBranch } = params;

  const { data: repoOverview, isLoading } =
    api.github.getRepositoryOverview.useQuery(
      {
        owner,
        repository,
      },
      {
        enabled: !!owner && !!repository,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );

  const defaultBranch = repoOverview?.defaultBranchRef?.name ?? "main";
  const branches = repoOverview?.refs?.nodes ?? [
    {
      name: currentBranch,
    },
  ];
  // The branch might not be in the URL if the user is at the root explorer path
  // We need to determine the selected branch based on the path or default
  const pathSegments = pathname.split("/");
  const viewTypeIndex = pathSegments.findIndex(
    (seg) => seg === "tree" || seg === "blob"
  );
  const branchFromPath =
    viewTypeIndex !== -1 && pathSegments.length > viewTypeIndex + 1
      ? pathSegments[viewTypeIndex + 1]
      : null;

  const selectedBranch = branchFromPath ?? defaultBranch;

  const handleBranchChange = (newBranch: string) => {
    if (newBranch === selectedBranch) return;

    // Construct the new path based on the current path structure
    // Assumes structure like /<owner>/<repo>/tree/<branch>/... or /<owner>/<repo>/blob/<branch>/...
    const pathSegments = pathname.split("/");
    const viewTypeIndex = pathSegments.findIndex(
      (seg) => seg === "tree" || seg === "blob"
    );

    if (viewTypeIndex !== -1 && pathSegments.length > viewTypeIndex + 1) {
      // Replace the branch segment
      pathSegments[viewTypeIndex + 1] = newBranch;
      // Keep the rest of the path if it exists
      const newPath = pathSegments.join("/");
      router.push(newPath);
    } else {
      // If not in tree/blob view, navigate to the root tree view of the new branch
      router.push(`/${owner}/${repository}/tree/${newBranch}`);
    }
  };

  if (!branches.length) {
    return (
      <div className="p-2 text-sm text-muted-foreground">No branches found</div>
    );
  }

  return (
    <Select value={selectedBranch} onValueChange={handleBranchChange}>
      <SelectTrigger className="w-full h-8 focus:ring-0 focus:ring-offset-0 border-none shadow-none !bg-transparent">
        <div className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap ">
          <span className="truncate font-medium max-w-48 flex items-center">
            <GitBranch className="mr-2 h-4 w-4" />
            {selectedBranch}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
        {branches.map((branch) => (
          <SelectItem
            key={branch.name}
            value={branch.name}
            className="w-full truncate"
            title={branch.name}
          >
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
