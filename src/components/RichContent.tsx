import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface RichContentProps {
  children: string | undefined | null;
  className?: string;
  /** Inline = render without block wrappers (for headings/inline use) */
  inline?: boolean;
}

/**
 * Universal renderer for rich-text fields stored as Markdown.
 * - Supports raw HTML (rehype-raw) so <span style="color:..."> from Word paste works.
 * - Renders ```python code blocks with syntax highlighting.
 * - Backwards compatible with plain text content (renders identically).
 */
const RichContent = ({ children, className, inline }: RichContentProps) => {
  const text = (children ?? "").toString();
  if (!text.trim()) return null;

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
        "prose-a:text-primary prose-strong:text-foreground prose-em:text-foreground",
        "prose-code:text-primary prose-code:before:content-none prose-code:after:content-none",
        inline && "prose-p:inline",
        className
      )}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ inline: isInline, className: cls, children: codeChildren, ...props }: any) {
            const match = /language-(\w+)/.exec(cls || "");
            const codeText = String(codeChildren).replace(/\n$/, "");
            if (!isInline && match) {
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={vscDarkPlus}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    background: "hsl(var(--muted) / 0.5)",
                  }}
                >
                  {codeText}
                </SyntaxHighlighter>
              );
            }
            return (
              <code
                className={cn(
                  "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]",
                  cls
                )}
                {...props}
              >
                {codeChildren}
              </code>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default RichContent;
