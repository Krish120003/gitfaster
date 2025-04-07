"use client";

import { Button } from "@/components/ui/button";

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
];

function TableRow({ data }: { data: File }) {
  return (
    <tr className="border-b border-foreground/40 [&>*]:py-1 text-sm">
      <td>{data.name}</td>
      <td>{data.type}</td>
      <td>{data.commitMsg}</td>
    </tr>
  );
}

export default function RepositoryFileList() {
  return (
    <section className="rounded border border-foreground/40">
      <table className="w-full">
        <tbody>
          <tr>
            <td>Krish: do xyz</td>
            <td>3 weeks ago . abc . 75 commits</td>
          </tr>
          {files.map((file, index) => (
            <TableRow key={index} data={file} />
          ))}
          {files.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center">
                No files found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
