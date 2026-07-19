import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

const GITHUB_ROOT = "https://github.com/uqrealitylabs";

export function systemPrefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(systemPrefersReducedMotion);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function DemoHeader({ name, slug }: { name: string; slug: string }) {
  return (
    <>
      <a className="skip-link" href="#playground">
        Skip to interactive demo
      </a>
      <header className="demo-header">
        <a className="demo-brand" href="/" aria-label="UQ Reality Labs home">
          <span className="demo-brand__mark" aria-hidden="true">
            ◎
          </span>
          <span>UQ Reality Labs / {name}</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#playground">Playground</a>
          <a href="#features">Features</a>
          <a href="#install">Install</a>
          <a href={`${GITHUB_ROOT}/${slug}/wiki`}>Docs</a>
          <a href={`${GITHUB_ROOT}/${slug}`}>GitHub</a>
        </nav>
      </header>
    </>
  );
}

export function DemoFooter({ name, slug }: { name: string; slug: string }) {
  return (
    <footer className="demo-footer">
      <span>{name} / interactive library demonstration</span>
      <span>UQ Reality Labs</span>
      <a href={`${GITHUB_ROOT}/${slug}`}>Source on GitHub</a>
    </footer>
  );
}

export function FeatureGrid({
  items,
}: {
  items: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="feature-grid">
      {items.map((item, index) => (
        <article className="feature-card" key={item.title}>
          <span className="feature-card__number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function CodeExample({
  code,
  filename,
}: {
  code: string;
  filename: string;
}) {
  const [status, setStatus] = useState("Copy code");
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
      timer.current = window.setTimeout(() => setStatus("Copy code"), 1600);
    } catch {
      setStatus("Copy failed");
    }
  }

  return (
    <div className="code-panel">
      <div className="panel-heading">
        <span>{filename}</span>
        <button type="button" className="text-button" onClick={copy}>
          {status}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

type ErrorBoundaryState = { error: Error | null };

export class DemoErrorBoundary extends Component<
  { children: ReactNode; label: string },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.label} failed`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="demo-fallback" role="alert">
        <h3>{this.props.label} could not start.</h3>
        <p>
          The rest of the demo is still available. Refresh to try the
          interactive view again.
        </p>
        <button
          type="button"
          className="button button--quiet"
          onClick={() => window.location.reload()}
        >
          Refresh demo
        </button>
      </div>
    );
  }
}
