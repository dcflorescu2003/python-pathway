import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
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
/**
 * Preserve leading whitespace on each line by converting it to non-breaking
 * spaces — but only OUTSIDE fenced code blocks (```), where Markdown already
 * preserves indentation. Without this, Markdown collapses leading spaces and
 * Python snippets pasted as plain text lose their indentation, breaking
 * exercise logic (e.g. `if x > 5:\n    print(1)` vs no indent).
 */
const preserveIndentation = (raw: string): string => {
  const NBSP = "\u00A0";
  const lines = raw.split("\n");
  let inFence = false;
  return lines
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line.replace(/^[ \t]+/, (lead) =>
        lead.replace(/\t/g, "    ").replace(/ /g, NBSP)
      );
    })
    .join("\n");
};

const RichContent = ({ children, className, inline }: RichContentProps) => {
  const raw = (children ?? "").toString();
  if (!raw.trim()) return null;
  const text = preserveIndentation(raw);

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
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // react-markdown v9+: no `inline` prop. Detect block via language-* class or newline.
          code({ className: cls, children: codeChildren, ...props }: any) {
            const match = /language-(\w+)/.exec(cls || "");
            const codeText = String(codeChildren ?? "").replace(/\n$/, "");
            const isBlock = !!match || codeText.includes("\n");
            if (isBlock) {
              return (
                <SyntaxHighlighter
                  language={match?.[1] || "text"}
                  style={vscDarkPlus}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
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
          pre({ children }: any) {
            // Avoid double <pre> wrapper since SyntaxHighlighter renders its own container.
            return <>{children}</>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default RichContent;
