// The playground's worker: plum runs here, off the page's thread, so a
// long program never freezes the page and Stop can end it at once
// (worker.terminate()). plum.js and plum.wasm are plumlang's `make wasm`
// build (plumlang docs/playground.md), copied here by scripts/sync-docs.mjs.
//
// Messages in:  { id, type: "run" | "check" | "format", source }
// Messages out: { type: "ready", version } once plum has loaded, or
//               { type: "failed", message } if it can't;
//               { id, type: "output", stream, text } while a program runs;
//               { id, type: "done", exitCode, ms } when it ends;
//               { id, type: "check", diagnostics } and { id, type: "format", result };
//               { id, type: "error", message } when plum itself failed.

import createPlum from "./plum.js";

const ready = createPlum().then(
  (plum) => {
    self.postMessage({ type: "ready", version: plum.version });
    return plum;
  },
  (error) => {
    self.postMessage({ type: "failed", message: String(error && error.message ? error.message : error) });
    throw error;
  },
);

// Output goes to the page in batches: a message per line would flood it
// when a program prints a lot.
const BATCH_BYTES = 8192;
const BATCH_MS = 50;
const MAX_OUTPUT = 1 << 20; // characters shown per run; the rest is counted

function runner(id) {
  let stream = "stdout";
  let buffer = "";
  let last = performance.now();
  let shown = 0;
  let dropped = 0;
  const flush = () => {
    if (buffer !== "") {
      self.postMessage({ id, type: "output", stream, text: buffer });
      buffer = "";
    }
    last = performance.now();
  };
  const write = (to) => (text) => {
    if (shown >= MAX_OUTPUT) {
      dropped += text.length;
      return;
    }
    if (to !== stream) {
      flush();
      stream = to;
    }
    const room = MAX_OUTPUT - shown;
    const part = text.length > room ? text.slice(0, room) : text;
    dropped += text.length - part.length;
    shown += part.length;
    buffer += part;
    if (buffer.length >= BATCH_BYTES || performance.now() - last >= BATCH_MS) flush();
  };
  return {
    onStdout: write("stdout"),
    onStderr: write("stderr"),
    finish() {
      flush();
      if (dropped > 0) {
        self.postMessage({
          id,
          type: "output",
          stream: "note",
          text: `\n[${dropped.toLocaleString("en")} more characters of output not shown]\n`,
        });
      }
    },
  };
}

self.onmessage = async ({ data }) => {
  const { id, type, source } = data;
  let plum;
  try {
    plum = await ready;
  } catch {
    return; // "failed" was sent
  }
  try {
    if (type === "run") {
      const out = runner(id);
      const start = performance.now();
      const result = plum.run(source, { onStdout: out.onStdout, onStderr: out.onStderr });
      out.finish();
      self.postMessage({ id, type: "done", exitCode: result.exitCode, ms: Math.round(performance.now() - start) });
    } else if (type === "check") {
      self.postMessage({ id, type: "check", diagnostics: plum.check(source) });
    } else if (type === "format") {
      self.postMessage({ id, type: "format", result: plum.format(source) });
    }
  } catch (error) {
    self.postMessage({ id, type: "error", message: String(error && error.message ? error.message : error) });
  }
};
