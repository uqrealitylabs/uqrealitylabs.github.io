import type { ContentBlock, ContentSection } from "./schema/contentSchema";

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return <p key={index}>{block.text}</p>;
    case "heading":
      if (block.level === 2) return <h2 key={index}>{block.text}</h2>;
      if (block.level === 3) return <h3 key={index}>{block.text}</h3>;
      return <h4 key={index}>{block.text}</h4>;
    case "list":
      return (
        <ul key={index}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote key={index}>
          <p>{block.text}</p>
          {block.cite ? <cite>{block.cite}</cite> : null}
        </blockquote>
      );
    case "link":
    case "cta":
      return (
        <a key={index} href={block.href}>
          {block.label}
        </a>
      );
    case "image":
      return (
        <figure key={index}>
          <img
            src={block.src}
            alt={block.decorative ? "" : block.alt}
            aria-hidden={block.decorative ? "true" : undefined}
          />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    case "callout":
      return (
        <aside key={index}>
          {block.title ? <h3>{block.title}</h3> : null}
          <p>{block.text}</p>
        </aside>
      );
    case "socialGrid":
      return <div key={index} data-content-slot="social-grid" />;
    case "rubricList":
      return (
        <dl key={index}>
          {block.items.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      );
    case "spacer":
      return (
        <div key={index} aria-hidden="true" data-spacer={block.size ?? "md"} />
      );
  }
}

function renderSection(section: ContentSection) {
  if (section.type === "socialGrid") {
    return <section key={section.id} data-content-slot="social-grid" />;
  }
  if (section.type === "committee") {
    return <section key={section.id} data-content-slot="committee" />;
  }
  return (
    <section key={section.id} id={section.id}>
      {section.blocks.map(renderBlock)}
    </section>
  );
}

export function ContentRenderer({ sections }: { sections: ContentSection[] }) {
  return <>{sections.map(renderSection)}</>;
}
