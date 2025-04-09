import type { FileType } from "@/server/api/routers/github";
import { PDFViewer } from "./pdf-viewer";

interface ContentProp {
  file: FileType;
  url: string;
}

const BinaryViewer: React.FC<ContentProp> = ({ file, url }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

  const imageFormats = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"];
  const videoFormats = ["mp4", "webm", "ogg"];
  const pdfFormats = ["pdf"];

  console.log("DEBUG FILE", file);

  //TODO: pdf don't work rn
  if (imageFormats.includes(fileExtension)) {
    return <img src={url} alt={file.name} />;
  } else if (videoFormats.includes(fileExtension)) {
    console.log("THIS IS A VIDEO");
    return (
      <video controls className="max-w-full">
        <source src={url} type={`video/${fileExtension}`} />
        Your browser does not support the video tag.
      </video>
    );
  } else if (pdfFormats.includes(fileExtension)) {
    return <PDFViewer url={url} />;
  }

  // Default fallback for unsupported binary files
  return <div>Binary file not supported for preview: {file.name}</div>;
};

const ContentViewer: React.FC<ContentProp> = ({ file, url }) => {
  console.log("DEBUG FILE", file);
  return file.isBinary === false ? (
    <pre className="text-sm font-mono whitespace-pre-wrap">{file.text}</pre> //this should be component to handle stuff like svg
  ) : (
    <BinaryViewer file={file} url={url} />
  );
};

export default ContentViewer;
