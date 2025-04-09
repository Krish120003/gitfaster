"use client";
import { useParams } from "next/navigation";
import React from "react";

function FilenameFromParams() {
  const { path } = useParams();
  const formattedPath = decodeURIComponent(
    (Array.isArray(path) ? path.join("/") : path) ?? ""
  );

  const filename = formattedPath.split("/").pop() || "";

  return <div className="text-sm">{filename}</div>;
}

export default FilenameFromParams;
