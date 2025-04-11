"use client";
import { useParams } from "next/navigation";

function FilenameFromParams() {
  const params = useParams();
  const formattedPath = decodeURIComponent(
    (Array.isArray(params.path) ? params.path.join("/") : params.path) ?? ""
  );

  const filename = formattedPath.split("/").pop() || "";

  return <div className="text-sm">{filename}</div>;
}

export default FilenameFromParams;
