"use client";

import type { FileType } from "@/server/api/routers/github";
import ShikiHighlighter from "react-shiki";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ContentProp {
  file: FileType;
  url: string;
}

const BinaryViewer: React.FC<ContentProp> = ({ file, url }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

  const imageFormats = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"];
  const videoFormats = ["mp4", "webm", "ogg"];
  const pdfFormats = ["pdf"];

  if (imageFormats.includes(fileExtension)) {
    return <img src={url} alt={file.name} />;
  } else if (videoFormats.includes(fileExtension)) {
    return (
      <video controls className="max-w-full">
        <source src={url} type={`video/${fileExtension}`} />
        Your browser does not support the video tag.
      </video>
    );
  } else if (pdfFormats.includes(fileExtension)) {
    return (
      <iframe
        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
          url
        )}`}
        className="w-full h-full min-h-[80vh] border-none"
      />
    );
  }

  // Default fallback for unsupported binary files
  return <div>Binary file not supported for preview: {file.name}</div>;
};

const useThemeDetector = () => {
  const getCurrentTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
  const mqListener = (e: MediaQueryListEvent) => {
    setIsDarkTheme(e.matches);
  };

  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", mqListener);
    return () => darkThemeMq.removeEventListener("change", mqListener);
  }, []);
  return isDarkTheme;
};

const TextViewer: React.FC<ContentProp> = ({ file, url }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
  const { theme } = useTheme();
  const isDarkTheme = useThemeDetector();

  if (fileExtension === "svg") {
    return <img src={url} alt={file.name} />;
  }

  return (
    <ShikiHighlighter
      language={fileExtension}
      className="text-sm"
      theme={
        theme === "system"
          ? isDarkTheme
            ? "github-dark-default"
            : "github-light"
          : theme ?? "github-light"
      }
    >
      {file.text || ""}
    </ShikiHighlighter>
  );
};

const ContentViewer: React.FC<ContentProp> = ({ file, url }) => {
  return file.isBinary === false ? (
    <TextViewer file={file} url={url} />
  ) : (
    <BinaryViewer file={file} url={url} />
  );
};

export default ContentViewer;
