"use client";

import { Button } from "@/components/ui/button";
import { File, Folder } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface File {
  name: string;
  type: "file" | "folder";
  commitMsg: string;
  date: string;
}

const files: File[] = [
  {
    name: "README.md",
    type: "file",
    commitMsg: "Initial commit",
    date: "2023-10-01",
  },
  {
    name: "src",
    type: "folder",
    commitMsg: "Added src folder",
    date: "2023-09-30",
  },
  {
    name: "package.json",
    type: "file",
    commitMsg: "Created package file",
    date: "2023-10-02",
  },
  {
    name: "node_modules",
    type: "folder",
    commitMsg: "Installed dependencies",
    date: "2023-10-02",
  },
  {
    name: ".gitignore",
    type: "file",
    commitMsg: "Configured ignore rules",
    date: "2023-10-01",
  },
  {
    name: "index.ts",
    type: "file",
    commitMsg: "Created index file",
    date: "2023-10-03",
  },
];

files.sort((a, b) => {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name);
  }
  return a.type === "folder" ? -1 : 1;
});

function TableRow({ data }: { data: File }) {
  const pathname = usePathname();

  const basePath =
    data.type === "folder" ? `${pathname}/tree/main` : `${pathname}/blob/main`;

  const path = `${basePath}/${data.name}`;

  return (
    <tr className="border-t border-foreground/40 [&>*]:p-2 text-sm">
      <td className="flex items-center gap-1">
        <Link
          href={path}
          className="flex items-center gap-1 hover:underline hover:text-blue-500"
        >
          {data.type === "folder" ? (
            <Folder
              className="text-foreground/60 h-4"
              fill="currentColor"
              stroke="none"
            />
          ) : (
            <File className="text-foreground/60 h-4" />
          )}

          {data.name}
        </Link>
      </td>
      <td>{data.commitMsg}</td>
      <td>{data.date}</td>
    </tr>
  );
}

export default function RepositoryFileList() {
  return (
    <section className="rounded border border-foreground/40 overflow-clip">
      <div className="p-4 bg-foreground/10">Files</div>
      <table className="w-full">
        <tbody>
          {files.map((file, index) => (
            <TableRow key={index} data={file} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
