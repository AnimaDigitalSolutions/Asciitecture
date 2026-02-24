import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { TEMPLATES, CATEGORIES } from "./lib/templates";
import { Storage } from "./lib/storage";
import { exportMarkdown, copyToClipboard, downloadFile } from "./lib/export";

// ─── Constants ────────────────────────────────────────────────
const CELL_W = 10;
const CELL_H = 18;
const COLS = 100;
const ROWS = 50;

// ─── Unique ID Generator ──────────────────────────────────────
let _uid = 0;
const uid = () => `obj_${++_uid}_${Date.now()}`;

// ─── Grid / Buffer Operations ─────────────────────────────────
function createBuffer(cols, rows) {
  return Array.from({ length: rows }, () => " ".repeat(cols));
}

function stampObject(buffer, obj) {
  const { x, y, data } = obj;
  const result = buffer.map((row) => row.split(""));
  data.lines.forEach((line, dy) => {
    for (let dx = 0; dx < line.length; dx++) {
      const gx = x + dx;
      const gy = y + dy;
      if (gy >= 0 && gy < result.length && gx >= 0 && gx < (result[0]?.length || 0)) {
        result[gy][gx] = line[dx];
      }
    }
  });
  return result.map((row) => row.join(""));
}

function renderAllObjects(objects, cols, rows) {
  let buffer = createBuffer(cols, rows);
  objects.forEach((obj) => {
    buffer = stampObject(buffer, obj);
  });
  return buffer;
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select");
  const [placingTemplate, setPlacingTemplate] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [cursorPos, setCursorPos] = useState({ col: 0, row: 0 });
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownText, setMarkdownText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to light
    return localStorage.getItem('asciitecture_theme') || 'light';
  });
  const canvasRef = useRef(null);

  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) || null,
    [objects, selectedId]
  );

  const buffer = useMemo(
    () => renderAllObjects(objects, COLS, ROWS),
    [objects]
  );

  // ─── Theme handling ───────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('asciitecture_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // ─── Load from URL or localStorage on mount ──────────────
  useEffect(() => {
    const urlData = Storage.loadFromURL();
    if (urlData) {
      setObjects(urlData.objects);
      notify("Loaded shared design from URL");
    } else {
      const saved = Storage.load();
      if (saved && saved.objects) {
        setObjects(saved.objects);
        notify("Restored last session");
      }
    }
  }, []);

  // ─── Auto-save ────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      Storage.save({ objects });
    }, 1000);
    return () => clearTimeout(timer);
  }, [objects]);

  // ─── Notification helper ──────────────────────────────────
  const notify = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }, []);

  // ─── Canvas pixel → grid cell ─────────────────────────────
  const pixelToCell = useCallback(
    (px, py) => {
      const canvas = canvasRef.current;
      if (!canvas) return { col: 0, row: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (px - rect.left) / zoom;
      const y = (py - rect.top) / zoom;
      return {
        col: Math.floor(x / CELL_W),
        row: Math.floor(y / CELL_H),
      };
    },
    [zoom]
  );

  // ─── Hit test ─────────────────────────────────────────────
  const hitTest = useCallback(
    (col, row) => {
      for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];
        if (
          col >= o.x &&
          col < o.x + o.data.w &&
          row >= o.y &&
          row < o.y + o.data.h
        ) {
          return o;
        }
      }
      return null;
    },
    [objects]
  );

  // ─── Mouse handlers ──────────────────────────────────────
  const handleCanvasMouseDown = useCallback(
    (e) => {
      const { col, row } = pixelToCell(e.clientX, e.clientY);

      if (tool === "place" && placingTemplate) {
        const tmpl = TEMPLATES[placingTemplate];
        if (tmpl) {
          const data = tmpl.create();
          const newObj = { id: uid(), type: placingTemplate, x: col, y: row, data };
          setObjects((prev) => [...prev, newObj]);
          setSelectedId(newObj.id);
          notify(`Placed ${tmpl.label}`);
        }
        return;
      }

      const hit = hitTest(col, row);
      if (hit) {
        setSelectedId(hit.id);
        setDragState({ id: hit.id, startCol: col, startRow: row, origX: hit.x, origY: hit.y });
      } else {
        setSelectedId(null);
      }
    },
    [tool, placingTemplate, pixelToCell, hitTest, notify]
  );

  const handleCanvasMouseMove = useCallback(
    (e) => {
      const { col, row } = pixelToCell(e.clientX, e.clientY);
      setCursorPos({ col, row });

      if (dragState) {
        const dx = col - dragState.startCol;
        const dy = row - dragState.startRow;
        setObjects((prev) =>
          prev.map((o) =>
            o.id === dragState.id
              ? { ...o, x: Math.max(0, dragState.origX + dx), y: Math.max(0, dragState.origY + dy) }
              : o
          )
        );
      }
    },
    [dragState, pixelToCell]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // ─── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          setObjects((prev) => prev.filter((o) => o.id !== selectedId));
          setSelectedId(null);
          notify("Deleted");
        }
      }
      if (e.key === "Escape") {
        setTool("select");
        setPlacingTemplate(null);
        setSelectedId(null);
        setShowMarkdown(false);
        setShowImport(false);
        setShowHelp(false);
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedId) {
          const obj = objects.find((o) => o.id === selectedId);
          if (obj) {
            const dup = { ...obj, id: uid(), x: obj.x + 2, y: obj.y + 2, data: { ...obj.data, lines: [...obj.data.lines] } };
            setObjects((prev) => [...prev, dup]);
            setSelectedId(dup.id);
            notify("Duplicated");
          }
        }
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const shareUrl = Storage.shareViaURL(objects);
        copyToClipboard(shareUrl, 
          () => notify("Share URL copied to clipboard!"),
          () => notify("Failed to copy URL")
        );
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, objects, notify]);

  // ─── Export markdown ──────────────────────────────────────
  const handleExportMarkdown = useCallback(() => {
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
    const newObj = { id: uid(), type: "imported", x: 2, y: 2, data };
    setObjects((prev) => [...prev, newObj]);
    setShowImport(false);
    setImportText("");
    notify("Imported wireframe");
  }, [importText, notify]);

  // ─── Template placement ───────────────────────────────────
  const startPlace = useCallback((templateKey) => {
    setTool("place");
    setPlacingTemplate(templateKey);
    setSelectedId(null);
  }, []);

  // ─── Share URL ────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const shareUrl = Storage.shareViaURL(objects);
    copyToClipboard(shareUrl,
      () => notify("Share URL copied to clipboard!"),
      () => notify("Failed to copy URL")
    );
  }, [objects, notify]);

  // ─── Canvas rendering ────────────────────────────────────
  const canvasWidth = COLS * CELL_W;
  const canvasHeight = ROWS * CELL_H;

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups = {};
    Object.entries(TEMPLATES).forEach(([key, tmpl]) => {
      const cat = tmpl.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ key, ...tmpl });
    });
    return groups;
  }, []);

  // Theme colors
  const colors = theme === 'light' ? {
    background: '#ffffff',
    backgroundSecondary: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    borderDark: '#d1d5db',
    canvas: '#ffffff',
    grid: '#e5e7eb',
    selection: '#3b82f6',
    buttonBg: '#f3f4f6',
    buttonHover: '#e5e7eb',
    modalBg: '#ffffff',
    inputBg: '#f9fafb',
    codeBg: '#f3f4f6',
    categoryColors: {
      basics: "#4b5563",
      ui: "#f59e0b",
      layout: "#10b981",
      draw: "#ef4444",
    }
  } : {
    background: '#0f0f12',
    backgroundSecondary: '#18181b',
    text: '#f4f4f5',
    textSecondary: '#d4d4d8',
    textMuted: '#71717a',
    border: '#27272a',
    borderDark: '#3f3f46',
    canvas: '#0f0f12',
    grid: '#1a1a1f',
    selection: '#3b82f6',
    buttonBg: '#27272a',
    buttonHover: '#3f3f46',
    modalBg: '#18181b',
    inputBg: '#0f0f12',
    codeBg: '#0f0f12',
    categoryColors: {
      basics: "#8b9dc3",
      ui: "#dda15e",
      layout: "#6b9080",
      draw: "#b5838d",
    }
  };

  // ─── Theme-aware Styles ─────────────────────────────────
  const topBtnStyle = {
    padding: "6px 12px",
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 5,
    background: colors.buttonBg,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const toolBtnStyle = {
    padding: "4px 10px",
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 4,
    background: colors.buttonBg,
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const inspBtnStyle = {
    padding: "6px 10px",
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 4,
    background: colors.buttonBg,
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const kbdStyle = {
    display: "inline-block",
    padding: "1px 5px",
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 3,
    background: colors.buttonBg,
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: "inherit",
    marginRight: 4,
  };

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: theme === 'light' ? "#00000066" : "#000000aa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  };

  const modalStyle = {
    background: colors.modalBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 24,
    width: "90%",
    maxWidth: 480,
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: theme === 'light' ? "0 20px 60px #00000020" : "0 20px 60px #00000080",
  };

  const closeBtnStyle = {
    background: "none",
    border: "none",
    color: colors.textMuted,
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
  };

  const textareaStyle = {
    width: "100%",
    height: 240,
    padding: 12,
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 6,
    background: colors.inputBg,
    color: colors.text,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    resize: "vertical",
    lineHeight: 1.5,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        background: colors.background,
        color: colors.text,
        overflow: "hidden",
      }}
    >
      {/* ─── Top Bar ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          padding: "0 16px",
          borderBottom: `1px solid ${colors.border}`,
          background: colors.backgroundSecondary,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: colors.text, letterSpacing: -0.5 }}>
            ◻ Asciitecture
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              background: colors.borderDark,
              borderRadius: 4,
              color: colors.textMuted,
            }}
          >
            ASCII Wireframes
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowHelp(true)} style={topBtnStyle}>? Help</button>
          <button onClick={handleShare} style={topBtnStyle}>⇧ Share</button>
          <button onClick={() => setShowImport(true)} style={topBtnStyle}>↓ Import</button>
          <button onClick={handleExportMarkdown} style={{ ...topBtnStyle, background: "#3b82f6", color: "#fff" }}>
            ↑ Export MD
          </button>
        </div>
      </div>

      {/* ─── Main Area ────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── Left Panel ────────────────────────────────── */}
        <div
          style={{
            width: 220,
            borderRight: `1px solid ${colors.border}`,
            background: colors.backgroundSecondary,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {Object.entries(CATEGORIES).map(([catKey, cat]) => (
              <div key={catKey} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    padding: "4px 12px",
                    fontSize: 10,
                    color: colors.categoryColors[catKey] || colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {cat.label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "0 8px" }}>
                  {(groupedTemplates[catKey] || []).map((tmpl) => (
                    <button
                      key={tmpl.key}
                      onClick={() => startPlace(tmpl.key)}
                      title={tmpl.label}
                      style={{
                        width: 94,
                        padding: "6px 4px",
                        border:
                          placingTemplate === tmpl.key
                            ? "1px solid #3b82f6"
                            : `1px solid ${colors.borderDark}`,
                        borderRadius: 4,
                        background:
                          placingTemplate === tmpl.key ? "#3b82f620" : colors.buttonBg,
                        color: colors.textSecondary,
                        fontSize: 11,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{tmpl.icon}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tmpl.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Theme Toggle at Bottom */}
          <div style={{ 
            borderTop: `1px solid ${colors.border}`,
            padding: '12px'
          }}>
            <button
              onClick={toggleTheme}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${colors.borderDark}`,
                borderRadius: 6,
                background: colors.buttonBg,
                color: colors.textSecondary,
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? '🌙' : '☀️'} Switch theme
            </button>
          </div>
        </div>

        {/* ─── Canvas ────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", position: "relative", background: colors.canvas }}>
          {/* Toolbar strip */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              background: theme === 'light' ? "#f9fafbdd" : "#18181bdd",
              backdropFilter: "blur(8px)",
              borderBottom: `1px solid ${colors.border}`,
              fontSize: 12,
            }}
          >
            <button
              onClick={() => { setTool("select"); setPlacingTemplate(null); }}
              style={{
                ...toolBtnStyle,
                background: tool === "select" ? "#3b82f6" : colors.buttonBg,
                color: tool === "select" ? "#fff" : colors.textMuted,
              }}
            >
              ◇ Select
            </button>
            <span style={{ color: colors.borderDark }}>│</span>
            <span style={{ color: colors.textMuted }}>
              Ln {cursorPos.row + 1}, Col {cursorPos.col + 1}
            </span>
            <span style={{ color: colors.borderDark }}>│</span>
            <span style={{ color: colors.textMuted }}>{objects.length} objects</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} style={toolBtnStyle}>
              −
            </button>
            <span style={{ color: colors.textMuted, minWidth: 40, textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} style={toolBtnStyle}>
              +
            </button>
          </div>

          {/* Canvas area */}
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{
              width: canvasWidth * zoom,
              height: canvasHeight * zoom,
              position: "relative",
              cursor: tool === "place" ? "crosshair" : dragState ? "grabbing" : "default",
              margin: 20,
            }}
          >
            {/* Grid background */}
            <svg
              width={canvasWidth * zoom}
              height={canvasHeight * zoom}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
            >
              <defs>
                <pattern
                  id="grid"
                  width={CELL_W * zoom}
                  height={CELL_H * zoom}
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    width={CELL_W * zoom}
                    height={CELL_H * zoom}
                    fill="none"
                    stroke={colors.grid}
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Selection highlight */}
            {selectedObj && (
              <div
                style={{
                  position: "absolute",
                  left: selectedObj.x * CELL_W * zoom - 2,
                  top: selectedObj.y * CELL_H * zoom - 2,
                  width: selectedObj.data.w * CELL_W * zoom + 4,
                  height: selectedObj.data.h * CELL_H * zoom + 4,
                  border: `2px solid ${colors.selection}`,
                  borderRadius: 2,
                  pointerEvents: "none",
                  boxShadow: `0 0 12px ${colors.selection}20`,
                }}
              />
            )}

            {/* Rendered text */}
            <pre
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                fontSize: 14 * zoom,
                lineHeight: `${CELL_H * zoom}px`,
                letterSpacing: CELL_W * zoom - 14 * zoom * 0.6 + "px",
                fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                color: theme === 'light' ? '#111827' : '#e4e4e7',
                pointerEvents: "none",
                userSelect: "none",
                whiteSpace: "pre",
              }}
            >
              {buffer.join("\n")}
            </pre>
          </div>
        </div>
      </div>

      {/* ─── Status Bar ──────────────────────────────────── */}
      <div
        style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderTop: `1px solid ${colors.border}`,
          background: colors.backgroundSecondary,
          fontSize: 11,
          color: colors.textMuted,
          flexShrink: 0,
        }}
      >
        <span>
          {tool === "place"
            ? `Placing: ${TEMPLATES[placingTemplate]?.label || "?"} — click canvas to drop`
            : "Select mode — click objects to move them"}
        </span>
        <span>⌘S to share • ⌘D to duplicate • Del to delete</span>
      </div>

      {/* ─── Notification ────────────────────────────────── */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: 44,
            left: "50%",
            transform: "translateX(-50%)",
            background: colors.buttonBg,
            color: colors.text,
            padding: "8px 20px",
            borderRadius: 6,
            fontSize: 13,
            zIndex: 1000,
            border: `1px solid ${colors.borderDark}`,
            boxShadow: theme === 'light' ? "0 4px 20px #00000020" : "0 4px 20px #00000060",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {notification}
        </div>
      )}

      {/* ─── Markdown Modal ──────────────────────────────── */}
      {showMarkdown && (
        <div style={overlayStyle} onClick={() => setShowMarkdown(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: colors.text, fontSize: 16 }}>Markdown Export</h3>
              <button onClick={() => setShowMarkdown(false)} style={closeBtnStyle}>✕</button>
            </div>
            <p style={{ color: colors.textMuted, fontSize: 12, margin: "0 0 8px" }}>
              Paste this into AI coding assistants to implement your design.
            </p>
            <textarea
              readOnly
              value={markdownText}
              style={textareaStyle}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={copyMarkdown} style={{ ...inspBtnStyle, flex: 1, background: "#3b82f6", borderColor: "#3b82f6", color: "#fff" }}>
                Copy to Clipboard
              </button>
              <button onClick={() => setShowMarkdown(false)} style={{ ...inspBtnStyle, flex: 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Import Modal ────────────────────────────────── */}
      {showImport && (
        <div style={overlayStyle} onClick={() => setShowImport(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: colors.text, fontSize: 16 }}>Import Wireframe</h3>
              <button onClick={() => setShowImport(false)} style={closeBtnStyle}>✕</button>
            </div>
            <p style={{ color: colors.textMuted, fontSize: 12, margin: "0 0 8px" }}>
              Paste ASCII art or a markdown code block. It will be placed on the canvas as a single object.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"Paste your wireframe here...\n┌──────────┐\n│  Hello   │\n└──────────┘"}
              style={textareaStyle}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                style={{
                  ...inspBtnStyle,
                  flex: 1,
                  background: importText.trim() ? "#3b82f6" : colors.buttonBg,
                  borderColor: importText.trim() ? "#3b82f6" : colors.borderDark,
                  color: importText.trim() ? "#fff" : colors.textMuted,
                  cursor: importText.trim() ? "pointer" : "not-allowed",
                }}
              >
                Import
              </button>
              <button onClick={() => setShowImport(false)} style={{ ...inspBtnStyle, flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Help Modal ──────────────────────────────────── */}
      {showHelp && (
        <div style={overlayStyle} onClick={() => setShowHelp(false)}>
          <div style={{ ...modalStyle, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: colors.text, fontSize: 16 }}>◻ Asciitecture — Help</h3>
              <button onClick={() => setShowHelp(false)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: colors.text }}>What is this?</strong><br/>
                An ASCII wireframe editor for designing UI mockups that AI tools can understand. Export your designs as Markdown and paste them into AI coding assistants.
              </p>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: colors.text }}>How to use:</strong><br/>
                1. Click a component in the left panel<br/>
                2. Click on the canvas to place it<br/>
                3. Drag objects to reposition<br/>
                4. Export → paste into your AI tool
              </p>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: colors.text }}>Keyboard Shortcuts:</strong><br/>
                <kbd style={kbdStyle}>Del</kbd> Delete selected<br/>
                <kbd style={kbdStyle}>Esc</kbd> Deselect / close<br/>
                <kbd style={kbdStyle}>⌘D</kbd> Duplicate<br/>
                <kbd style={kbdStyle}>⌘S</kbd> Share URL
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: colors.text }}>Tips:</strong><br/>
                • Your work auto-saves locally<br/>
                • Share designs via URL<br/>
                • Import ASCII art from anywhere<br/>
                • Toggle {theme === 'light' ? 'dark' : 'light'} mode with the {theme === 'light' ? '🌙' : '☀️'} button
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}