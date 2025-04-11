"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export function RepositoryNavigation() {
  const params = useParams();
  const owner = params.owner as string;
  const repository = params.repository as string;

  return (
    <nav className="flex gap-4 border-b">
      <Link
        href={`/${owner}/${repository}`}
        className="border-b-2 border-transparent px-4 py-2 hover:border-gray-300"
      >
        Code
      </Link>
      <Link
        href={`/${owner}/${repository}/issues`}
        className="border-b-2 border-transparent px-4 py-2 hover:border-gray-300"
      >
        Issues
      </Link>
      <Link
        href={`/${owner}/${repository}/pulls`}
        className="border-b-2 border-transparent px-4 py-2 hover:border-gray-300"
      >
        Pull Requests
      </Link>
    </nav>
  );
}
