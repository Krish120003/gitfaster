"use client";

import type { FileType } from "@/server/api/routers/github";
import ShikiHighlighter from "react-shiki";

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

const TextViewer: React.FC<ContentProp> = ({ file, url }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

  if (fileExtension === "svg") {
    return <img src={url} alt={file.name} />;
  }

  return (
    // <pre className="text-sm font-mono whitespace-pre-wrap">{file.text}</pre>
    <ShikiHighlighter language={fileExtension} theme="github-light">
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
