"use client";

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  return (
    <iframe
      src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        url
      )}`}
      className="w-full h-full min-h-[80vh] border-none"
    />
  );
}
