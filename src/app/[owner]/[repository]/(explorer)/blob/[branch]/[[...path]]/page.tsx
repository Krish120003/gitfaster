"use client";
import { FileContentView } from "@/app/[owner]/[repository]/_components/repository-file";
import { useParams } from "next/navigation";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    branch: string;
    path: string | string[] | undefined;
  }>;
}

export default function Page({ params }: PageProps) {
  // const { owner, repository, branch, path } = await params;

  // const formattedPath = (Array.isArray(path) ? path.join("/") : path) ?? "";

  const { owner, repository, branch, path } = useParams();
  const formattedPath = decodeURIComponent(
    (Array.isArray(path) ? path.join("/") : path) ?? ""
  );

  return (
    <div>
      <FileContentView
        owner={owner as string}
        repository={repository as string}
        branch={branch as string}
        path={formattedPath}
      />
    </div>
  );
}
