"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  width?: number;
}

export function PDFViewer({ url, width = 600 }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col items-center"
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
      {numPages && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {pageNumber} of {numPages}
          </p>
          <button
            onClick={() =>
              setPageNumber((prev) => Math.min(prev + 1, numPages))
            }
            disabled={pageNumber >= numPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
