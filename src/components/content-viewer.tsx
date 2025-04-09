import type { FileType } from "@/server/api/routers/github";

interface ContentProp {
  file: FileType;
  url: string;
}

const BinaryViewer: React.FC<ContentProp> = ({ file, url }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

  const imageFormats = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"];
  const videoFormats = ["mp4", "webm", "ogg"];
  const pdfFormats = ["pdf"];

  //TODO: pdf and video don't work rn
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
      <iframe src={url} title={file.name} className="w-full h-[80vh]">
        PDF preview not available.
      </iframe>
    );
  }

  // Default fallback for unsupported binary files
  return <div>Binary file not supported for preview: {file.name}</div>;
};

const ContentViewer: React.FC<ContentProp> = ({ file, url }) => {
  return file.isBinary ? (
    <BinaryViewer file={file} url={url} />
  ) : (
    <pre className="text-sm font-mono whitespace-pre-wrap">{file.text}</pre> //this should be component to handle stuff like svg
  );
};

export default ContentViewer;
