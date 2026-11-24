import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);

const suggestions = [
  {
    icon: "sparkles",
    title: "Explain a complex topic",
    description:
      "Deep dive into Raft consensus vs Paxos with failure mode recovery and network partitioning.",
    prompt:
      "Explain the key differences between Raft consensus and Paxos, including failure recovery and network partitions.",
  },
  {
    icon: "terminal",
    title: "Architect & write code",
    description:
      "Scaffold an event-driven Go microservice with Kafka, PostgreSQL outbox, and OpenTelemetry.",
    prompt:
      "Help me architect an event-driven microservice. Explain the main components and show a starter implementation.",
  },
  {
    icon: "brackets",
    title: "Analyze documents & data",
    description:
      "Paste reports or OpenAPI specs for a quick summary and schema review.",
    prompt:
      "I have a document to analyze. What information should I provide so you can summarize it and identify inconsistencies?",
  },
  {
    icon: "bulb",
    title: "Generate product ideas",
    description:
      "Brainstorm developer tooling, SDK ergonomics, and next-gen CLI feedback loops.",
    prompt:
      "Brainstorm some useful product ideas for developer tools. Include who each idea helps and why.",
  },
];

function Icon({ name, size = 16, strokeWidth = 1.8 }) {
  const paths = {
    assistant: (
      <>
        <path d="M12 2.8 14.2 8l5 2-5 2.2-2.2 5-2.1-5-5.1-2.2 5.1-2z" />
        <path d="m18.7 16 .8 1.8 1.7.7-1.7.8-.8 1.7-.7-1.7-1.8-.8 1.8-.7z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    chat: (
      <>
        <path d="M20 11.4a7.8 7.8 0 0 1-8 7.5 8.7 8.7 0 0 1-3.4-.7L4 20l1.2-3.6a7.2 7.2 0 0 1-1.3-4.1A7.8 7.8 0 0 1 12 4.8a7.8 7.8 0 0 1 8 6.6Z" />
      </>
    ),
    folder: (
      <path d="M3.5 6.5h6l2 2h9v9.8a1.2 1.2 0 0 1-1.2 1.2H4.7a1.2 1.2 0 0 1-1.2-1.2zM3.5 8.5h17" />
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    send: (
      <>
        <path d="m21 3-7.2 18-3.7-7.1L3 10.2 21 3Z" />
        <path d="M10.1 13.9 15 9" />
      </>
    ),
    paperclip: (
      <path d="m8.5 12.5 6.7-6.7a3.2 3.2 0 0 1 4.5 4.5l-8.8 8.8a5 5 0 0 1-7.1-7.1l8.4-8.4" />
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M4 17v3h16v-3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    moon: (
      <path d="M19.2 15.1A8 8 0 0 1 8.9 4.8 8.2 8.2 0 1 0 19.2 15.1Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
      </>
    ),
    terminal: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="m7 9 3 3-3 3m6 0h4" />
      </>
    ),
    brackets: (
      <>
        <path d="m8 5-5 7 5 7m8-14 5 7-5 7m-2-16-4 18" />
      </>
    ),
    bulb: (
      <>
        <path d="M9 18h6m-5 3h4m-2-19a7 7 0 0 0-4 12.7c.8.6 1 1.1 1 2.3h6c0-1.2.2-1.7 1-2.3A7 7 0 0 0 12 2Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.sparkle}
    </svg>
  );
}

function getRouteId() {
  const match = window.location.pathname.match(/^\/chat\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isChatRoute() {
  return /^\/chat(?:\/|$)/.test(window.location.pathname);
}

async function fetchJSON(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((item) => item.msg).join(", ");
      }
    } catch {
      // Keep the HTTP status as the visible error when the server didn't send JSON.
    }
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

function formatGroup(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = (now.getTime() - date.getTime()) / 86400000;
  return days < 7 ? "Previous 7 days" : "Earlier";
}

function CodeBlock({ children, className }) {
  const [copyStatus, setCopyStatus] = useState("");
  const language = className?.replace("language-", "") || "code";
  const text = String(children).replace(/\n$/, "");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(""), 1600);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus(""), 1600);
    }
  }

  return (
    <div className="code-card">
      <div className="code-toolbar">
        <span className="code-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="code-language">{language}</span>
        <button className="code-copy" type="button" onClick={copyCode}>
          <Icon name={copyStatus === "Copied" ? "check" : "copy"} size={13} />
          {copyStatus || "Copy code"}
        </button>
      </div>
      <pre>
        <code className={className}>{text}</code>
      </pre>
    </div>
  );
}

function Markdown({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre({ children }) {
          return <>{children}</>;
        },
        code({ className, children, ...props }) {
          if (className) {
            return (
              <CodeBlock className={className}>{children}</CodeBlock>
            );
          }
          return (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function Welcome({ onSuggestion }) {
  return (
    <section className="welcome">
      <div className="welcome-mark">
        <Icon name="assistant" size={27} strokeWidth={1.6} />
      </div>
      <h1>How can I help you today?</h1>
      <p className="welcome-subtitle">
        Ask a question, explore an idea, or work through a tricky problem.
      </p>
      <div className="suggestion-grid">
        {suggestions.map((item) => (
          <button
            className="suggestion-card"
            key={item.title}
            type="button"
            onClick={() => onSuggestion(item.prompt)}
          >
            <span className="suggestion-heading">
              <span className="suggestion-icon">
                <Icon name={item.icon} size={15} />
              </span>
              {item.title}
            </span>
            <span className="suggestion-description">{item.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Message({ message, onRetry }) {
  const isUser = message.role === "user";

  return (
    <article className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      {!isUser && (
        <div className="avatar assistant-avatar">
          <Icon name="assistant" size={17} />
        </div>
      )}
      <div className="message-content">
        {isUser ? (
          <div className="user-bubble">{message.content}</div>
        ) : (
          <>
            <div className="assistant-meta">
              <span className="assistant-name">Tovin</span>
              {message.streaming && <span className="streaming-label">Thinking</span>}
            </div>
            {message.content ? (
              <div className="markdown-body">
                <Markdown content={message.content} />
              </div>
            ) : message.streaming ? (
              <div className="typing-indicator" aria-label="Assistant is typing">
                <i />
                <i />
                <i />
              </div>
            ) : null}
            {message.tokenUsage && (
              <span className="token-note">
                {message.tokenUsage.input_tokens + message.tokenUsage.output_tokens}{" "}
                tokens {message.tokenUsage.estimated ? "· estimated" : "· used"}
              </span>
            )}
            {message.error && (
              <div className="inline-error">
                <span>{message.error}</span>
                {onRetry && (
                  <button type="button" onClick={onRetry}>
                    Try again
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {isUser && <div className="avatar user-avatar">Y</div>}
    </article>
  );
}

function LandingPage({ onStartChat }) {
  const features = [
    {
      icon: "chat",
      title: "Streaming conversations",
      description:
        "Watch answers arrive as they are generated, so you can follow along without waiting for the whole response.",
    },
    {
      icon: "brackets",
      title: "Code and Markdown, together",
      description:
        "Explore formatted explanations, readable code blocks, tables, and copyable snippets in one place.",
    },
    {
      icon: "folder",
      title: "Conversation history",
      description:
        "Pick up where you left off. Your chats are saved by the connected backend and easy to find again.",
    },
    {
      icon: "paperclip",
      title: "Bring your context",
      description:
        "Add supported text, Markdown, code, CSV, and JSON files to a prompt right from your browser.",
    },
    {
      icon: "moon",
      title: "Incognito when you need it",
      description:
        "Have a private session that is not added to saved chat history.",
    },
    {
      icon: "sparkles",
      title: "A focused workspace",
      description:
        "Keep questions, code, and ideas together in a calm interface designed for getting into the details.",
    },
  ];

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Tovin home">
          <span className="landing-brand-mark">
            <Icon name="assistant" size={18} />
          </span>
          <span>Tovin</span>
        </a>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#pricing">Getting started</a>
        </nav>
        <div className="landing-header-actions">
          <a className="landing-docs-link" href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
            API docs
          </a>
          <button className="landing-header-cta" onClick={onStartChat}>
            Open Tovin <Icon name="arrow" size={14} />
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">
              <span className="landing-live-dot" />
              A clearer space to think and build
            </div>
            <h1>
              Your ideas,
              <br />
              in good <span>company.</span>
            </h1>
            <p className="landing-hero-description">
              Meet Tovin, your AI workspace for thoughtful answers, practical
              code, and the next step in whatever you’re working on.
            </p>
            <div className="landing-hero-actions">
              <button className="landing-primary-button" onClick={onStartChat}>
                Start a conversation <Icon name="arrow" size={16} />
              </button>
              <a className="landing-secondary-button" href="#features">
                Explore features
              </a>
            </div>
            <p className="landing-reassurance">
              No account required for this setup
              <span>·</span>
              You control your backend configuration
            </p>
            <div className="landing-hero-points">
              <div>
                <span className="hero-point-icon"><Icon name="sparkles" size={15} /></span>
                <span><b>Answers as they happen</b><small>Live streaming replies</small></span>
              </div>
              <div>
                <span className="hero-point-icon green"><Icon name="folder" size={15} /></span>
                <span><b>Pick up where you left off</b><small>Saved conversation history</small></span>
              </div>
            </div>
          </div>

          <div className="landing-preview-wrap" aria-label="Preview of the Tovin chat workspace">
            <div className="landing-glow" />
            <div className="landing-preview">
              <div className="preview-topbar">
                <div className="preview-window-dots"><i /><i /><i /></div>
                <div className="preview-brand"><span><Icon name="assistant" size={12} /></span> Tovin <small>WORKSPACE</small></div>
                <div className="preview-ready"><i /> Ready</div>
              </div>
              <div className="preview-context">
                <span><Icon name="folder" size={12} /> New conversation</span>
                <span><i /> Context ready</span>
              </div>
              <div className="preview-user">
                <span className="preview-avatar user">Y</span>
                <div><small>YOU <time>JUST NOW</time></small><p>How can I make this idea simpler without losing what matters?</p></div>
              </div>
              <div className="preview-answer">
                <div className="preview-answer-heading">
                  <span className="preview-avatar bot"><Icon name="assistant" size={13} /></span>
                  <strong>Tovin</strong><span className="preview-stream">REPLYING</span>
                </div>
                <p>Start with the <b>one outcome</b> you want people to remember. Then make every supporting detail earn its place.</p>
                <div className="preview-code">
                  <div><i /><i /><i /><span>your-idea.md</span><Icon name="copy" size={12} /></div>
                  <code><em># The core idea</em><br /><span>One clear outcome.</span><br /><span>One reason it matters.</span><br /><span>One next step to try.</span></code>
                </div>
                <div className="preview-answer-tail"><span>Clear, useful, and ready to build on.</span><i /></div>
              </div>
              <div className="preview-composer">
                <span>Ask a follow-up or share more context…</span>
                <button aria-label="Send"><Icon name="send" size={14} /></button>
              </div>
              <div className="preview-footnote">A workspace for the way you think.</div>
            </div>
            <div className="preview-float-card">
              <span className="float-icon"><Icon name="check" size={13} /></span>
              <span><b>Your context, in view</b><small>Continue the conversation naturally</small></span>
            </div>
          </div>
        </section>

        <section className="landing-how" id="how-it-works">
          <div className="landing-section-heading">
            <span className="landing-kicker">MADE FOR YOUR FLOW</span>
            <h2>From first question to <span>clear next step.</span></h2>
            <p>Less setup between you and the work. Just bring a question, a thought, or a piece of code.</p>
          </div>
          <div className="landing-steps">
            <article className="landing-step">
              <span className="step-number">01</span>
              <div className="step-icon"><Icon name="chat" size={19} /></div>
              <h3>Start with a thought</h3>
              <p>Ask a question, describe a problem, or paste in the code you’re working through.</p>
            </article>
            <article className="landing-step">
              <span className="step-number">02</span>
              <div className="step-icon lavender"><Icon name="sparkles" size={19} /></div>
              <h3>Work it through</h3>
              <p>Get a live response with readable explanations, formatted code, and room to follow up.</p>
            </article>
            <article className="landing-step">
              <span className="step-number">03</span>
              <div className="step-icon mint"><Icon name="arrow" size={19} /></div>
              <h3>Keep moving</h3>
              <p>Save useful conversations for later, or start a private chat when you prefer.</p>
            </article>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="landing-section-heading">
            <span className="landing-kicker">A THOUGHTFUL TOOLKIT</span>
            <h2>Everything you need to <span>get into it.</span></h2>
            <p>A few helpful details make a big difference when you’re deep in a task.</p>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature, index) => (
              <article className="landing-feature-card" key={feature.title}>
                <span className={`feature-icon feature-icon-${index % 4}`}>
                  <Icon name={feature.icon} size={18} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-arrow"><Icon name="arrow" size={14} /></span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-privacy" id="privacy">
          <div className="privacy-art" aria-hidden="true">
            <div className="privacy-orbit orbit-one" />
            <div className="privacy-orbit orbit-two" />
            <div className="privacy-lock"><Icon name="moon" size={26} /></div>
            <span className="privacy-star star-one">✦</span>
            <span className="privacy-star star-two">✧</span>
          </div>
          <div className="privacy-copy">
            <span className="landing-kicker">YOUR SPACE, YOUR WAY</span>
            <h2>A little more private, when you need it.</h2>
            <p>
              Turn on incognito for a chat you don’t want saved to your history.
              Your messages are still sent to the configured AI service to
              generate a reply.
            </p>
            <button className="landing-text-button" onClick={onStartChat}>
              Try a private conversation <Icon name="arrow" size={15} />
            </button>
          </div>
        </section>

        <section className="landing-getting-started" id="pricing">
          <span className="landing-kicker">SIMPLE TO GET STARTED</span>
          <h2>Your next good idea is a<br /><span>conversation away.</span></h2>
          <p>Open Tovin, ask what’s on your mind, and take it from there.</p>
          <button className="landing-primary-button" onClick={onStartChat}>
            Start a conversation <Icon name="arrow" size={16} />
          </button>
          <div className="getting-started-notes">
            <span><Icon name="check" size={13} /> Works with your configured backend</span>
            <span><Icon name="check" size={13} /> No account flow in this demo</span>
            <span><Icon name="check" size={13} /> Your chats, your choice</span>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="landing-brand footer-brand" href="/">
          <span className="landing-brand-mark"><Icon name="assistant" size={15} /></span>
          <span>Tovin</span>
        </a>
        <span>Made for curious minds and thoughtful work.</span>
        <div><a href="#features">Features</a><a href="#privacy">Privacy</a><a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">API docs</a></div>
      </footer>
    </div>
  );
}

export default function App() {
  const initialRouteId = useRef(getRouteId());
  const initialIsChatRoute = useRef(isChatRoute());
  const [chatRoute, setChatRoute] = useState(initialIsChatRoute.current);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialRouteId.current);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [modelName, setModelName] = useState("");
  const [pageError, setPageError] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [incognito, setIncognito] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [openConversationMenu, setOpenConversationMenu] = useState(null);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const endOfMessages = useRef(null);
  const textarea = useRef(null);
  const fileInput = useRef(null);

  const refreshConversations = useCallback(async () => {
    const data = await fetchJSON("/api/conversations");
    setConversations(data.items || []);
  }, []);

  const loadConversation = useCallback(async (sessionId) => {
    setActiveId(sessionId);
    setIncognito(false);
    setSidebarOpen(false);
    setIsLoadingChat(true);
    setPageError("");
    setMessages([]);
    window.history.pushState({}, "", `/chat/${encodeURIComponent(sessionId)}`);
    setChatRoute(true);
    try {
      const data = await fetchJSON(
        `/api/conversations/${encodeURIComponent(sessionId)}/messages`,
      );
      setMessages(
        (data.items || []).map((item, index) => ({
          id: `${sessionId}-${index}`,
          role: item.role,
          content: item.content,
        })),
      );
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchJSON("/health")
      .then((health) => {
        if (!mounted) return;
        setBackendStatus(health.database_ok ? "online" : "offline");
        setModelName(health.model || "");
      })
      .catch(() => {
        if (mounted) setBackendStatus("offline");
      });

    refreshConversations().catch((error) => {
      if (mounted && initialIsChatRoute.current) {
        setPageError(`Could not load chat history: ${error.message}`);
      }
    });

    if (initialRouteId.current) {
      const sessionId = initialRouteId.current;
      setIsLoadingChat(true);
      fetchJSON(
        `/api/conversations/${encodeURIComponent(sessionId)}/messages`,
      )
        .then((data) => {
          if (!mounted) return;
          setMessages(
            (data.items || []).map((item, index) => ({
              id: `${sessionId}-${index}`,
              role: item.role,
              content: item.content,
            })),
          );
        })
        .catch((error) => {
          if (mounted) setPageError(error.message);
        })
        .finally(() => {
          if (mounted) setIsLoadingChat(false);
        });
    }

    function onPopState() {
      const sessionId = getRouteId();
      setChatRoute(isChatRoute());
      setActiveId(sessionId);
      setPageError("");
      if (!sessionId) {
        setMessages([]);
        setIncognito(false);
        return;
      }
      setIsLoadingChat(true);
      fetchJSON(`/api/conversations/${encodeURIComponent(sessionId)}/messages`)
        .then((data) => {
          setMessages(
            (data.items || []).map((item, index) => ({
              id: `${sessionId}-${index}`,
              role: item.role,
              content: item.content,
            })),
          );
        })
        .catch((error) => setPageError(error.message))
        .finally(() => setIsLoadingChat(false));
    }
    window.addEventListener("popstate", onPopState);
    return () => {
      mounted = false;
      window.removeEventListener("popstate", onPopState);
    };
  }, [refreshConversations]);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function onShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        startNewChat();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const filteredConversations = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return conversations
      .filter((item) =>
        normalized
          ? `${item.title} ${item.preview}`.toLowerCase().includes(normalized)
          : true,
      )
      .reduce((groups, item) => {
        const group = formatGroup(item.updated_at);
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
      }, {});
  }, [conversations, search]);

  function startNewChat() {
    setChatRoute(true);
    setActiveId(null);
    setMessages([]);
    setDraft("");
    setAttachedFiles([]);
    setPageError("");
    setIncognito(false);
    setSidebarOpen(false);
    window.history.pushState({}, "", "/chat");
    window.setTimeout(() => textarea.current?.focus(), 0);
  }

  function goHome(event) {
    event.preventDefault();
    window.history.pushState({}, "", "/");
    setChatRoute(false);
    setSidebarOpen(false);
  }

  function updateMessage(id, updater) {
    setMessages((current) =>
      current.map((item) => (item.id === id ? updater(item) : item)),
    );
  }

  async function deleteConversation(conversation) {
    const title = conversation.title || "this chat";
    if (!window.confirm(`Permanently delete "${title}" and its messages?`)) {
      setOpenConversationMenu(null);
      return;
    }

    setDeletingConversationId(conversation.session_id);
    setPageError("");
    try {
      await fetchJSON(
        `/api/conversations/${encodeURIComponent(conversation.session_id)}`,
        { method: "DELETE" },
      );
      setConversations((current) =>
        current.filter((item) => item.session_id !== conversation.session_id),
      );
      setOpenConversationMenu(null);
      if (activeId === conversation.session_id) {
        setChatRoute(true);
        setActiveId(null);
        setMessages([]);
        setIncognito(false);
        window.history.pushState({}, "", "/chat");
      }
      setToast("Chat deleted");
    } catch (error) {
      setPageError(`Could not delete chat: ${error.message}`);
    } finally {
      setDeletingConversationId(null);
    }
  }

  async function sendMessage(event) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    const userMessage = { id: crypto.randomUUID(), role: "user", content };
    const assistantId = crypto.randomUUID();
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    };
    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-12)
      .map(({ role, content: text }) => ({ role, content: text }));
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft("");
    setAttachedFiles([]);
    setPageError("");
    setIsSending(true);
    if (textarea.current) textarea.current.style.height = "auto";

    let streamedText = "";
    let returnedSessionId = activeId;
    try {
      const response = await fetch(`${API_URL}/api/analyze/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          ...(activeId ? { session_id: activeId } : {}),
          incognito,
          ...(incognito ? { history } : {}),
        }),
      });
      if (!response.ok) {
        let detail = `Request failed (${response.status})`;
        try {
          const body = await response.json();
          if (typeof body.detail === "string") {
            detail = body.detail;
          } else if (Array.isArray(body.detail)) {
            detail = body.detail.map((item) => item.msg).join(", ");
          }
        } catch {
          // Keep the HTTP status as the visible error when the server didn't send JSON.
        }
        throw new Error(detail);
      }
      if (!response.body) {
        throw new Error("The browser could not read the streaming response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let completed = false;
      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const item = JSON.parse(line);
          if (item.type === "analysis") {
            returnedSessionId = item.session_id;
            setActiveId(item.session_id);
            if (!incognito) {
              window.history.replaceState(
                {},
                "",
                `/chat/${encodeURIComponent(item.session_id)}`,
              );
            }
          } else if (item.type === "token") {
            streamedText += item.text;
            updateMessage(assistantId, (current) => ({
              ...current,
              content: current.content + item.text,
            }));
          } else if (item.type === "done") {
            completed = true;
            updateMessage(assistantId, (current) => ({
              ...current,
              streaming: false,
              tokenUsage: item.token_usage,
            }));
          } else if (item.type === "error") {
            throw new Error(item.detail || "The assistant could not finish this reply.");
          }
        }
        if (done) break;
      }
      if (pending.trim()) {
        const item = JSON.parse(pending);
        if (item.type === "done") {
          completed = true;
          updateMessage(assistantId, (current) => ({
            ...current,
            streaming: false,
            tokenUsage: item.token_usage,
          }));
        } else if (item.type === "error") {
          throw new Error(item.detail || "The assistant could not finish this reply.");
        }
      }
      if (!completed) {
        throw new Error("The connection ended before the assistant finished.");
      }
      if (!incognito) {
        try {
          await refreshConversations();
        } catch (error) {
          setPageError(`Reply received, but chat history could not refresh: ${error.message}`);
        }
      }
    } catch (error) {
      updateMessage(assistantId, (current) => ({
        ...current,
        content: streamedText
          ? `${streamedText}\n\n**The reply was interrupted:** ${error.message}`
          : "",
        streaming: false,
        error: error.message,
      }));
      if (backendStatus !== "online") setBackendStatus("offline");
    } finally {
      if (returnedSessionId) setActiveId(returnedSessionId);
      setIsSending(false);
    }
  }

  function onComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  }

  function onComposerChange(event) {
    setDraft(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`;
  }

  async function attachTextFile(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      const additions = await Promise.all(
        files.map(async (file) => {
          if (file.size > 1024 * 1024) {
            throw new Error(`${file.name} is larger than the 1 MB attachment limit.`);
          }
          const text = await file.text();
          return { name: file.name, text };
        }),
      );
      const attachments = additions.map(({ name, text }) => ({
        id: crypto.randomUUID(),
        name,
        block: `\n\n--- ${name} ---\n${text}`,
      }));
      const formatted = attachments.map((attachment) => attachment.block).join("");
      const nextDraft = `${draft}${formatted}`.trimStart();
      if (nextDraft.length > 5000) {
        throw new Error("The message plus attachments exceeds the 5,000 character limit.");
      }
      setDraft(nextDraft);
      setAttachedFiles((current) => [
        ...current,
        ...attachments,
      ]);
      textarea.current?.focus();
    } catch (error) {
      setPageError(`Could not read the selected file: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  }

  async function copyConversation() {
    const text = messages
      .map((item) => `${item.role === "user" ? "You" : "Tovin"}\n${item.content}`)
      .join("\n\n");
    if (!text) {
      setToast("Nothing to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setToast("Conversation copied");
    } catch {
      setToast("Clipboard access is unavailable");
    }
  }

  function downloadConversation() {
    if (!messages.length) {
      setToast("Nothing to export yet");
      return;
    }
    const text = messages
      .map((item) => `## ${item.role === "user" ? "You" : "Tovin"}\n\n${item.content}`)
      .join("\n\n---\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "tovin-conversation.md";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Conversation exported");
  }

  const activeTitle =
    conversations.find((item) => item.session_id === activeId)?.title || "New Chat";

  if (!chatRoute) {
    return <LandingPage onStartChat={startNewChat} />;
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button
        className="mobile-backdrop"
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="sidebar">
        <div className="brand">
          <a className="brand-home" href="/" onClick={goHome} aria-label="Tovin home">
            <span className="brand-mark">
              <Icon name="assistant" size={17} />
            </span>
            <span className="brand-name">Tovin</span>
          </a>
          <span className="brand-version">v1.0</span>
          <button
            className="icon-button mobile-close"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="sidebar-tools">
          <button className="new-chat-button" onClick={startNewChat}>
            <Icon name="plus" size={15} />
            <span>New chat</span>
            <kbd>⌘ K</kbd>
          </button>
          <label className="search-box">
            <Icon name="search" size={15} />
            <input
              aria-label="Search history"
              placeholder="Search history..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <Icon name="close" size={13} />
              </button>
            )}
          </label>
        </div>
        <nav className="conversation-list" aria-label="Conversation history">
          {Object.keys(filteredConversations).length ? (
            Object.entries(filteredConversations).map(([group, items]) => (
              <section className="conversation-group" key={group}>
                <h2>{group}</h2>
                {items.map((item) => (
                  <div
                    className={`conversation-item ${activeId === item.session_id ? "active" : ""}`}
                    key={item.session_id}
                  >
                    <button
                      className="conversation-link"
                      title={item.title}
                      onClick={() => loadConversation(item.session_id)}
                    >
                      <Icon name="chat" size={14} />
                      <span>{item.title || item.preview}</span>
                    </button>
                    <button
                      className="conversation-options"
                      aria-label={`Options for ${item.title || "chat"}`}
                      aria-expanded={openConversationMenu === item.session_id}
                      disabled={deletingConversationId === item.session_id}
                      onClick={() =>
                        setOpenConversationMenu((current) =>
                          current === item.session_id ? null : item.session_id,
                        )
                      }
                    >
                      <Icon name="more" size={15} />
                    </button>
                    {openConversationMenu === item.session_id && (
                      <div className="conversation-menu" role="menu">
                        <button
                          className="delete-chat-option"
                          role="menuitem"
                          disabled={deletingConversationId === item.session_id}
                          onClick={() => deleteConversation(item)}
                        >
                          <Icon name="trash" size={14} />
                          {deletingConversationId === item.session_id
                            ? "Deleting..."
                            : "Delete chat"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ))
          ) : (
            <div className="history-empty">
              {search ? "No matching chats" : "Your chats will appear here"}
            </div>
          )}
        </nav>
        <div className="sidebar-account">
          <div className="profile-avatar">T</div>
          <div className="profile-copy">
            <span>Tovin workspace</span>
            <span>
              <i className={`status-dot ${backendStatus}`} />
              {backendStatus === "online"
                ? "Backend connected"
                : backendStatus === "checking"
                  ? "Connecting..."
                  : "Backend offline"}
            </span>
          </div>
          <button
            className="icon-button"
            title="Check backend status"
            aria-label="Check backend status"
            onClick={() => {
              setBackendStatus("checking");
              fetchJSON("/health")
                .then((health) => {
                  setBackendStatus(health.database_ok ? "online" : "offline");
                  setModelName(health.model || "");
                })
                .catch(() => setBackendStatus("offline"));
            }}
          >
            <Icon name="more" />
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="chat" />
            </button>
            <span className="workspace-label">
              <Icon name="folder" size={15} />
              <span>Workspace</span>
            </span>
            <span className="breadcrumb-divider">/</span>
            <span className="current-chat-title">{activeTitle}</span>
          </div>
          <div className="topbar-right">
            <span className={`connection-pill ${backendStatus}`}>
              <i className={`status-dot ${backendStatus}`} />
              <span>
                {backendStatus === "online"
                  ? "API connected"
                  : backendStatus === "checking"
                    ? "Connecting"
                    : "API offline"}
              </span>
            </span>
            <div
              className={`model-pill ${incognito ? "incognito-active" : ""}`}
              title={modelName || "Model configured on backend"}
            >
              <span className="model-indicator" />
              <span>{modelName || "Assistant"}</span>
              <span className="model-caret">⌄</span>
            </div>
            <button
              className={`icon-button privacy-button ${incognito ? "selected" : ""}`}
              title={
                messages.length
                  ? "Start a new chat to change privacy mode"
                  : incognito
                    ? "Turn off incognito"
                    : "Turn on incognito"
              }
              aria-label={incognito ? "Turn off incognito" : "Turn on incognito"}
              disabled={messages.length > 0}
              onClick={() => setIncognito((value) => !value)}
            >
              <Icon name={incognito ? "moon" : "sun"} size={15} />
            </button>
            {messages.length > 0 && (
              <>
                <button
                  className="icon-button topbar-action"
                  title="Copy conversation"
                  aria-label="Copy conversation"
                  onClick={copyConversation}
                >
                  <Icon name="copy" size={15} />
                </button>
                <button
                  className="icon-button topbar-action"
                  title="Export conversation"
                  aria-label="Export conversation"
                  onClick={downloadConversation}
                >
                  <Icon name="download" size={15} />
                </button>
              </>
            )}
          </div>
        </header>

        {pageError && (
          <div className="error-banner" role="alert">
            <span>{pageError}</span>
            <button
              aria-label="Dismiss error"
              className="icon-button"
              onClick={() => setPageError("")}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        )}

        <div className="chat-viewport">
          {isLoadingChat ? (
            <div className="loading-state">
              <span className="loading-spinner" />
              Loading conversation…
            </div>
          ) : messages.length === 0 ? (
            <Welcome
              onSuggestion={(prompt) => {
                setDraft(prompt);
                textarea.current?.focus();
              }}
            />
          ) : (
            <div className="messages">
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  onRetry={
                    message.error && index === messages.length - 1
                      ? () => {
                          const userMessage = messages[index - 1];
                          if (userMessage?.role === "user") {
                            setDraft(userMessage.content);
                            setMessages((current) => current.slice(0, -2));
                            window.setTimeout(() => textarea.current?.focus(), 0);
                          }
                        }
                      : null
                  }
                />
              ))}
              <div ref={endOfMessages} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {incognito && (
            <div className="incognito-note">
              <Icon name="moon" size={13} />
              Incognito is on — this conversation won’t be saved to history.
            </div>
          )}
          {attachedFiles.length > 0 && (
            <div className="attachment-list">
              {attachedFiles.map((attachment) => (
                <span className="attachment-chip" key={attachment.id}>
                  <Icon name="paperclip" size={12} />
                  {attachment.name}
                  <button
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() => {
                      setDraft((current) => current.replace(attachment.block, ""));
                      setAttachedFiles((current) =>
                        current.filter((item) => item.id !== attachment.id),
                      );
                    }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form className="composer" onSubmit={sendMessage}>
            <textarea
              ref={textarea}
              aria-label="Message Tovin"
              placeholder="Ask anything, or paste code…"
              rows={1}
              maxLength={5000}
              value={draft}
              onChange={onComposerChange}
              onKeyDown={onComposerKeyDown}
              disabled={isSending}
            />
            <div className="composer-footer">
              <div className="composer-tools">
                <button
                  type="button"
                  className="tool-chip"
                  onClick={() => fileInput.current?.click()}
                  title="Add a text, code, CSV, or JSON file"
                >
                  <Icon name="paperclip" size={14} />
                  <span>Attach</span>
                </button>
                <input
                  ref={fileInput}
                  className="file-input"
                  type="file"
                  accept=".txt,.md,.csv,.json,.ts,.tsx,.js,.jsx,.py,.html,.css"
                  multiple
                  onChange={attachTextFile}
                />
                <span className="format-hint">TXT · MD · CSV · CODE</span>
              </div>
              <div className="composer-submit">
                <span className="keyboard-hint">
                  <kbd>↵</kbd> Send
                  <span className="hint-divider">·</span>
                  <kbd>⇧ ↵</kbd> New line
                </span>
                <button
                  className="send-button"
                  type="submit"
                  aria-label={isSending ? "Sending message" : "Send message"}
                  disabled={!draft.trim() || isSending}
                >
                  {isSending ? (
                    <span className="send-spinner" />
                  ) : (
                    <Icon name="send" size={17} />
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="disclaimer">
            Tovin can make mistakes. Check important information.
          </p>
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
