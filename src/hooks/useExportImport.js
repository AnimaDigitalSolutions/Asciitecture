import { useState, useCallback } from "react";
import { exportMarkdown, copyToClipboard } from "../lib/export";

// ─── Unique ID Generator ──────────────────────────────────────
let _uid = 0;
const uid = () => `obj_${++_uid}_${Date.now()}`;

export function useExportImport(objects, setObjectsWithHistory, notify, activeLayer) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownText, setMarkdownText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  // ─── Export markdown ──────────────────────────────────────
  const handleExportMarkdown = useCallback(() => {
    const COLS = 100;
    const ROWS = 50;
    const md = exportMarkdown(objects, COLS, ROWS);
    setMarkdownText(md);
    setShowMarkdown(true);
  }, [objects]);

  const copyMarkdown = useCallback(() => {
    copyToClipboard(markdownText,
      () => notify("Copied to clipboard!"),
      () => notify("Failed to copy")
    );
  }, [markdownText, notify]);

  // ─── Import ────────────────────────────────────────────────
  const handleImport = useCallback(() => {
    let text = importText;
    text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
    const lines = text.split("\n");
    const data = { lines, w: Math.max(...lines.map((l) => l.length)), h: lines.length };
    const newObj = { id: uid(), type: "imported", x: 2, y: 2, data, layerId: activeLayer };
    setObjectsWithHistory((prev) => [...prev, newObj]);
    setShowImport(false);
    setImportText("");
    notify("Imported wireframe");
  }, [importText, notify, activeLayer, setObjectsWithHistory]);

  return {
    // State
    showMarkdown,
    setShowMarkdown,
    markdownText,
    showImport,
    setShowImport,
    importText,
    setImportText,
    
    // Handlers
    handleExportMarkdown,
    copyMarkdown,
    handleImport
  };
}