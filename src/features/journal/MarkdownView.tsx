import { Fragment, useMemo } from 'react';
import { parseMarkdown, type Block, type Inline } from './markdown';

/**
 * Renders a journal entry's Markdown as real elements.
 *
 * Never dangerouslySetInnerHTML. The text is whatever the writer typed, and
 * parsing to a tree is the entire reason nothing they type can become markup.
 *
 * No colours of its own: the entry sits on the journal paper, so ink is
 * inherited and the quote rule and code border ride on currentColor. That keeps
 * it correct on both Bloom and Carbon without props.
 *
 * A heading inside an entry is an <h3> — the page owns h1, the editor owns h2.
 */

const CODE = 'rounded border px-1 py-px font-mono text-[0.9em]';

function renderSpans(spans: Inline[]) {
  return spans.map((span, i) => {
    switch (span.type) {
      case 'bold':
        return (
          <strong key={i} className="font-semibold">
            {span.value}
          </strong>
        );
      case 'italic':
        return <em key={i}>{span.value}</em>;
      case 'strike':
        return (
          <s key={i} className="opacity-70">
            {span.value}
          </s>
        );
      case 'code':
        return (
          <code key={i} className={CODE} style={{ borderColor: 'currentColor' }}>
            {span.value}
          </code>
        );
      default:
        return <Fragment key={i}>{span.value}</Fragment>;
    }
  });
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h3 key={i} className="mt-4 text-[1.15em] font-semibold leading-snug first:mt-0">
          {renderSpans(block.spans)}
        </h3>
      );
    case 'quote':
      return (
        <blockquote
          key={i}
          className="my-2 border-l-2 pl-3 opacity-80"
          style={{ borderColor: 'currentColor' }}
        >
          {renderSpans(block.spans)}
        </blockquote>
      );
    case 'ul':
      return (
        <ul key={i} className="my-2 list-disc space-y-1 pl-5">
          {block.items.map((item, j) => (
            <li key={j}>{renderSpans(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={i} className="my-2 list-decimal space-y-1 pl-5">
          {block.items.map((item, j) => (
            <li key={j}>{renderSpans(item)}</li>
          ))}
        </ol>
      );
    default:
      return <p key={i}>{renderSpans(block.spans)}</p>;
  }
}

export default function MarkdownView({ md, className }: { md: string; className?: string }) {
  const blocks = useMemo(() => parseMarkdown(md), [md]);
  return <div className={className}>{blocks.map(renderBlock)}</div>;
}
