"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Share2, Square, WandSparkles } from "lucide-react";
import { escapeHtml, highlightPlum } from "@/lib/highlight";
import type { PlaygroundExample } from "@/lib/playground";
import { decodeShare, encodeShare } from "@/lib/share";
import { cn } from "@/lib/utils";

/**
 * The playground: an editor (a textarea over highlighted text), Run,
 * Format and Share, and the output. plum runs in a Web Worker
 * (public/playground/worker.js), so the page stays responsive and Stop can
 * end a program at once.
 */

/** A diagnostic as plum.check() gives it: lines and columns from 1, in UTF-16 units. */
type Diagnostic = {
  severity: "error" | "warning";
  code: string;
  message: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
};

type Chunk = { stream: "stdout" | "stderr" | "note"; text: string };
type Status = "loading" | "ready" | "running" | "failed";
type Reply = { id?: number; type: string; [key: string]: unknown };

const WORKER_URL = "/playground/worker.js";

/** The string offset of a line and column (both from 1), clamped to the text. */
function offsetOf(lineStarts: number[], length: number, line: number, column: number): number {
  const start = lineStarts[Math.min(Math.max(line, 1), lineStarts.length) - 1];
  return Math.min(start + Math.max(column, 1) - 1, length);
}

function lineStartsOf(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return starts;
}

/**
 * The layer under the text that marks the diagnostics: each span
 * underlined, and the first message of a line written after its end.
 */
function diagnosticsHtml(text: string, diagnostics: Diagnostic[]): string {
  const starts = lineStartsOf(text);
  const marks = diagnostics
    .map((d) => {
      const from = offsetOf(starts, text.length, d.line, d.column);
      let to = offsetOf(starts, text.length, d.endLine, d.endColumn);
      if (to <= from) to = from + 1; // a point: mark one character
      return { from, to, d };
    })
    .sort((a, b) => a.from - b.from);
  const messages = new Map<number, Diagnostic>();
  for (const { d } of marks) if (!messages.has(d.line)) messages.set(d.line, d);

  let html = "";
  let pos = 0;
  let line = 1;
  // Copy text up to `stop`, adding each line's message before its line break.
  const copy = (stop: number, inside = false) => {
    while (pos < stop) {
      const nl = text.indexOf("\n", pos);
      if (nl === -1 || nl >= stop) {
        html += escapeHtml(text.slice(pos, stop));
        pos = stop;
        return;
      }
      html += escapeHtml(text.slice(pos, nl));
      if (inside) html += "</span>";
      html += messageHtml(messages.get(line));
      html += "\n";
      if (inside) html += "<span class=\"pg-mark\">";
      pos = nl + 1;
      line++;
    }
  };
  for (const { from, to, d } of marks) {
    if (from < pos) continue; // overlaps the one before
    copy(from);
    html += `<span class="pg-mark pg-${d.severity}">`;
    // A mark at a line break or the end shows as a space.
    if (from >= text.length || text[from] === "\n") {
      html += " </span>";
      continue;
    }
    copy(Math.min(to, text.length), true);
    html += "</span>";
  }
  copy(text.length);
  html += messageHtml(messages.get(line));
  return `${html}\n`;
}

function messageHtml(d: Diagnostic | undefined): string {
  if (!d) return "";
  return `<span class="pg-inline pg-${d.severity}">    ${d.line}:${d.column} ${escapeHtml(d.message)}</span>`;
}

export function Playground({ examples }: { examples: PlaygroundExample[] }) {
  const [source, setSource] = useState(examples[0]?.source ?? "");
  const [exampleId, setExampleId] = useState(examples[0]?.id ?? "");
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [output, setOutput] = useState<Chunk[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [version, setVersion] = useState("");
  const [result, setResult] = useState<{ exitCode: number; ms: number } | null>(null);
  const [notice, setNotice] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(1);
  const runId = useRef(0);
  const checkId = useRef(0);
  const formatId = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef(source);
  const handleRef = useRef<(reply: Reply) => void>(() => {});

  const append = useCallback((chunk: Chunk) => {
    setOutput((chunks) => {
      const last = chunks[chunks.length - 1];
      if (last && last.stream === chunk.stream) {
        return [...chunks.slice(0, -1), { stream: last.stream, text: last.text + chunk.text }];
      }
      return [...chunks, chunk];
    });
  }, []);

  /** Start plum in a new worker (on load, and after Stop). */
  const startWorker = useCallback(() => {
    workerRef.current?.terminate();
    const worker = new Worker(WORKER_URL, { type: "module" });
    worker.onmessage = (event: MessageEvent<Reply>) => handleRef.current(event.data);
    worker.onerror = () => {
      setStatus("failed");
      setNotice("plum couldn't load in this browser. It needs WebAssembly and module workers.");
    };
    workerRef.current = worker;
  }, []);

  const post = useCallback((type: "run" | "check" | "format", text: string) => {
    const id = nextId.current++;
    workerRef.current?.postMessage({ id, type, source: text });
    return id;
  }, []);

  // What the worker says.
  useEffect(() => {
    handleRef.current = (reply: Reply) => {
      switch (reply.type) {
        case "ready":
          setVersion(String(reply.version));
          setStatus((s) => (s === "loading" ? "ready" : s));
          checkId.current = post("check", sourceRef.current);
          break;
        case "failed":
          setStatus("failed");
          setNotice(`plum couldn't start: ${String(reply.message)}`);
          break;
        case "output":
          if (reply.id === runId.current) append({ stream: reply.stream as Chunk["stream"], text: String(reply.text) });
          break;
        case "done":
          if (reply.id === runId.current) {
            setResult({ exitCode: Number(reply.exitCode), ms: Number(reply.ms) });
            setStatus("ready");
          }
          break;
        case "check":
          if (reply.id === checkId.current) setDiagnostics(reply.diagnostics as Diagnostic[]);
          break;
        case "format": {
          if (reply.id !== formatId.current) break;
          const formatted = reply.result as { ok: boolean; text?: string; diagnostics?: Diagnostic[] };
          if (formatted.ok && formatted.text !== undefined) {
            if (formatted.text !== sourceRef.current) setSource(formatted.text);
            setNotice("Formatted.");
          } else {
            setDiagnostics(formatted.diagnostics ?? []);
            setNotice("Fix the syntax errors first: plum formats only a program that parses.");
          }
          break;
        }
        case "error":
          // plum itself failed: start a fresh one.
          append({ stream: "note", text: `\nplum stopped unexpectedly (${String(reply.message)}); it has been restarted.\n` });
          setStatus("loading");
          startWorker();
          break;
      }
    };
  }, [append, post, startWorker]);

  useEffect(() => {
    startWorker();
    return () => workerRef.current?.terminate();
  }, [startWorker]);

  // A program in the link's hash (a share link) replaces the example.
  useEffect(() => {
    const load = () => {
      decodeShare(window.location.hash).then(
        (text) => {
          if (text === null) return;
          setSource(text);
          setExampleId("");
          setNotice("Opened the program from the link.");
        },
        (error: unknown) => setNotice(`That share link couldn't be opened: ${error instanceof Error ? error.message : String(error)}`),
      );
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  // Check the program as it is edited.
  useEffect(() => {
    sourceRef.current = source;
    if (status === "loading" || status === "failed") return;
    const timer = window.setTimeout(() => {
      checkId.current = post("check", source);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [source, status, post]);

  const run = useCallback(() => {
    if (status !== "ready") return;
    setOutput([]);
    setResult(null);
    setNotice("");
    setStatus("running");
    runId.current = post("run", sourceRef.current);
  }, [status, post]);

  const stop = useCallback(() => {
    runId.current = 0;
    append({ stream: "note", text: "\nStopped.\n" });
    setStatus("loading");
    startWorker();
  }, [append, startWorker]);

  const format = useCallback(() => {
    if (status !== "ready") return;
    formatId.current = post("format", sourceRef.current);
  }, [status, post]);

  const share = useCallback(async () => {
    const hash = await encodeShare(sourceRef.current);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    window.history.replaceState(null, "", hash);
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied: it holds the whole program, so it works without an account or a server.");
    } catch {
      setNotice("Copy the link below: it holds the whole program.");
    }
  }, []);

  const chooseExample = (id: string) => {
    const example = examples.find((e) => e.id === id);
    if (!example) return;
    setExampleId(id);
    setSource(example.source);
    setShareUrl("");
    setNotice("");
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  };

  /** Type `text` at the caret, keeping the editor's undo history where the browser can. */
  const insert = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    if (!document.execCommand("insertText", false, text)) {
      const { selectionStart, selectionEnd, value } = ta;
      const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
      setSource(next);
      requestAnimationFrame(() => ta.setSelectionRange(selectionStart + text.length, selectionStart + text.length));
    }
  };

  const escaped = useRef(false);
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = event.currentTarget;
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      run();
    } else if (event.key === "Escape") {
      escaped.current = true; // the next Tab leaves the editor
      return;
    } else if (event.key === "Tab" && !event.shiftKey && !escaped.current && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      insert("    ");
    } else if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
      // Keep the line's indent, one level more after "{".
      const before = ta.value.slice(0, ta.selectionStart);
      const lineStart = before.lastIndexOf("\n") + 1;
      const indent = /^[ \t]*/.exec(before.slice(lineStart))?.[0] ?? "";
      event.preventDefault();
      insert(`\n${indent}${before.trimEnd().endsWith("{") ? "    " : ""}`);
    }
    escaped.current = false;
  };

  /** The highlighted layers and the line numbers follow the textarea's scrolling. */
  const onScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    for (const layer of layersRef.current?.querySelectorAll("pre") ?? []) {
      layer.scrollTop = ta.scrollTop;
      layer.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }, []);

  // And after the text changes (formatting, an example).
  useEffect(() => onScroll(), [source, diagnostics, onScroll]);

  /** Select a diagnostic's span in the editor. */
  const reveal = (d: Diagnostic) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const starts = lineStartsOf(ta.value);
    const from = offsetOf(starts, ta.value.length, d.line, d.column);
    const to = Math.max(offsetOf(starts, ta.value.length, d.endLine, d.endColumn), from);
    ta.focus();
    ta.setSelectionRange(from, to);
  };

  const highlighted = useMemo(() => `${highlightPlum(source)}\n`, [source]);
  const marked = useMemo(() => diagnosticsHtml(source, diagnostics), [source, diagnostics]);
  const lineCount = useMemo(() => lineStartsOf(source).length, [source]);
  const badLines = useMemo(() => {
    const lines = new Map<number, Diagnostic["severity"]>();
    for (const d of diagnostics) if (lines.get(d.line) !== "error") lines.set(d.line, d.severity);
    return lines;
  }, [diagnostics]);
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  const groups = useMemo(() => {
    const byGroup = new Map<string, PlaygroundExample[]>();
    for (const e of examples) byGroup.set(e.group, [...(byGroup.get(e.group) ?? []), e]);
    return [...byGroup];
  }, [examples]);

  const busy = status !== "ready";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section aria-label="Program" className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--code-border)] bg-[var(--code-bg)] text-[var(--code-fg)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--code-border)] px-3 py-2.5">
          <label className="sr-only" htmlFor="pg-example">
            Example
          </label>
          <select
            id="pg-example"
            value={exampleId}
            onChange={(e) => chooseExample(e.target.value)}
            className="h-8 min-w-0 max-w-[14rem] rounded-full border border-[var(--code-border)] bg-transparent px-3 font-mono text-[0.75rem] text-[var(--code-fg)]"
          >
            {exampleId === "" && <option value="">Your program</option>}
            {groups.map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ToolButton onClick={format} disabled={busy} label="Format" icon={<WandSparkles className="size-3.5" aria-hidden="true" />} />
            <ToolButton onClick={share} label="Share" icon={<Share2 className="size-3.5" aria-hidden="true" />} />
            {status === "running" ? (
              <ToolButton onClick={stop} label="Stop" primary icon={<Square className="size-3.5" aria-hidden="true" />} />
            ) : (
              <ToolButton
                onClick={run}
                disabled={busy}
                label={status === "loading" ? "Loading…" : "Run"}
                title="Run (Ctrl+Enter)"
                primary
                icon={<Play className="size-3.5" aria-hidden="true" />}
              />
            )}
          </div>
        </div>

        <div className="pg-editor">
          <div ref={gutterRef} className="pg-gutter" aria-hidden="true">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className={cn(badLines.has(i + 1) && `pg-gutter-${badLines.get(i + 1)}`)}>
                {i + 1}
              </div>
            ))}
            <div>&nbsp;</div>
          </div>
          <div ref={layersRef} className="pg-code">
            <pre className="pg-layer" aria-hidden="true" dangerouslySetInnerHTML={{ __html: marked }} />
            <pre className="pg-layer pg-highlight" aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlighted }} />
            <textarea
              ref={textareaRef}
              className="pg-input"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setExampleId("");
              }}
              onKeyDown={onKeyDown}
              onScroll={onScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              wrap="off"
              aria-label="Plumlang program"
              aria-describedby="pg-problems"
            />
          </div>
        </div>

        <div id="pg-problems" className="border-t border-[var(--code-border)] px-4 py-2.5 font-mono text-[0.75rem]">
          {diagnostics.length === 0 ? (
            <p className="text-[var(--tok-comment)]">{status === "loading" ? "Loading plum…" : "No problems."}</p>
          ) : (
            <ul className="space-y-1">
              {diagnostics.map((d, i) => (
                <li key={i}>
                  <button type="button" onClick={() => reveal(d)} className="text-left hover:underline">
                    <span className={d.severity === "error" ? "text-[var(--pg-error)]" : "text-[var(--pg-warning)]"}>
                      {d.line}:{d.column} {d.severity}[{d.code}]
                    </span>{" "}
                    {d.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Output" className="flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-primary">Output</p>
          <p className="ml-auto font-mono text-[0.72rem] text-muted-foreground" aria-live="polite">
            {status === "running"
              ? "Running…"
              : result
                ? `exit code ${result.exitCode} · ${result.ms} ms`
                : status === "failed"
                  ? "not available"
                  : status === "loading"
                    ? "loading plum…"
                    : errors > 0
                      ? `${errors} error${errors === 1 ? "" : "s"}`
                      : version
                        ? `plum ${version}`
                        : ""}
          </p>
        </div>
        <pre className="pg-output" aria-live="polite">
          {output.length === 0 ? (
            <span className="text-muted-foreground">{status === "failed" ? notice : "Run the program to see what it prints."}</span>
          ) : (
            output.map((chunk, i) => (
              <span key={i} className={cn(chunk.stream === "stderr" && "pg-stderr", chunk.stream === "note" && "pg-note")}>
                {chunk.text}
              </span>
            ))
          )}
        </pre>
        {(notice || shareUrl) && status !== "failed" && (
          <div className="space-y-2 border-t px-4 py-3 text-[0.8rem] text-muted-foreground">
            {notice && <p>{notice}</p>}
            {shareUrl && (
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Share link"
                className="w-full rounded-md border bg-background px-2 py-1 font-mono text-[0.72rem] text-foreground"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  icon,
  title,
  disabled = false,
  primary = false,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  title?: string;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[0.78rem] font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
        primary ? "bg-[var(--paper)] text-[var(--plum-night)] hover:opacity-85" : "border border-[var(--code-border)] hover:bg-white/10",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
