"use client";

import { useEffect } from "react";
import { useState } from "react";
import { createHighlighter } from "shiki";

interface CodeBlockProps {
  code: string;
  language: string;
  theme?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  theme = "github-light",
}) => {
  const [highlightedCode, setHighlightedCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const highlighter = await createHighlighter({
          themes: [theme],
          langs: [language],
        });

        const html = highlighter.codeToHtml(code, {
          lang: language,
          theme: theme,
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Failed to highlight code:", error);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [code, language, theme]);

  if (isLoading) {
    return <div>Loading syntax highlighter...</div>;
  }

  return (
    <div
      className="code-block"
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
};

export default CodeBlock;
