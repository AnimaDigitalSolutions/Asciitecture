import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────
const CELL_W = 12.5;
const CELL_H = 22.5;
const COLS = 100;
const ROWS = 50;

// ─── ASCII Component Templates ────────────────────────────────
const TEMPLATES = {
  button: {
    label: "Button",
    category: "ui",
    icon: "▣",
    create: (text = "Button") => {
      const w = text.length + 4;
      const top = "┌" + "─".repeat(w - 2) + "┐";
      const mid = "│ " + text + " │";
      const bot = "└" + "─".repeat(w - 2) + "┘";
      return { lines: [top, mid, bot], w, h: 3 };
    },
  },
  input: {
    label: "Input",
    category: "ui",
    icon: "▭",
    create: (placeholder = "Enter text...", width = 30) => {
      const inner = placeholder.padEnd(width - 4, " ");
      const top = "┌" + "─".repeat(width - 2) + "┐";
      const mid = "│ " + inner + " │";
      const bot = "└" + "─".repeat(width - 2) + "┘";
      return { lines: [top, mid, bot], w: width, h: 3 };
    },
  },
  card: {
    label: "Card",
    category: "ui",
    icon: "☐",
    create: (title = "Card Title", width = 30, height = 10) => {
      const lines = [];
      lines.push("╔" + "═".repeat(width - 2) + "╗");
      lines.push("║ " + title.padEnd(width - 4) + " ║");
      lines.push("╠" + "═".repeat(width - 2) + "╣");
      for (let i = 0; i < height - 4; i++) {
        lines.push("║" + " ".repeat(width - 2) + "║");
      }
      lines.push("╚" + "═".repeat(width - 2) + "╝");
      return { lines, w: width, h: height };
    },
  },
  table: {
    label: "Table",
    category: "ui",
    icon: "▦",
    create: (cols = ["Name", "Email", "Role"], rows = 3) => {
      const colW = 16;
      const totalW = cols.length * (colW + 1) + 1;
      const lines = [];
      const hSep = "┼" + cols.map(() => "─".repeat(colW)).join("┼") + "┼";
      lines.push("┌" + cols.map(() => "─".repeat(colW)).join("┬") + "┐");
      lines.push(
        "│" + cols.map((c) => (" " + c).padEnd(colW)).join("│") + "│"
      );
      lines.push("├" + cols.map(() => "─".repeat(colW)).join("┼") + "┤");
      for (let r = 0; r < rows; r++) {
        lines.push(
          "│" + cols.map(() => " ".repeat(colW)).join("│") + "│"
        );
      }
      lines.push("└" + cols.map(() => "─".repeat(colW)).join("┴") + "┘");
      return { lines, w: totalW, h: rows + 4 };
    },
  },
  modal: {
    label: "Modal",
    category: "ui",
    icon: "❐",
    create: (title = "Dialog", width = 40, height = 14) => {
      const lines = [];
      lines.push("╔" + "═".repeat(width - 2) + "╗");
      lines.push(
        "║ " + title.padEnd(width - 8) + " [X] ║"
      );
      lines.push("╠" + "═".repeat(width - 2) + "╣");
      for (let i = 0; i < height - 6; i++) {
        lines.push("║" + " ".repeat(width - 2) + "║");
      }
      lines.push("╠" + "═".repeat(width - 2) + "╣");
      const btnRow =
        "║" +
        " ".repeat(width - 24) +
        "[ Cancel ] [ OK ] ║";
      lines.push(btnRow);
      lines.push("╚" + "═".repeat(width - 2) + "╝");
      return { lines, w: width, h: height };
    },
  },
  tabs: {
    label: "Tabs",
    category: "ui",
    icon: "⊞",
    create: (labels = ["Tab 1", "Tab 2", "Tab 3"]) => {
      const tabParts = labels.map(
        (l, i) => (i === 0 ? "┌" : "┬") + "─".repeat(l.length + 2)
      );
      const top = tabParts.join("") + "┐";
      const mid =
        labels.map((l, i) => (i === 0 ? "│" : "│") + " " + l + " ").join("") +
        "│";
      const w = top.length;
      const bot = "┴" + "─".repeat(w - 2) + "┘";
      return { lines: [top, mid, bot], w, h: 3 };
    },
  },
  checkbox: {
    label: "Checkbox",
    category: "ui",
    icon: "☑",
    create: (label = "Option", checked = false) => {
      const mark = checked ? "x" : " ";
      return { lines: [`[${mark}] ${label}`], w: label.length + 4, h: 1 };
    },
  },
  radio: {
    label: "Radio",
    category: "ui",
    icon: "◉",
    create: (label = "Option", selected = false) => {
      const mark = selected ? "●" : " ";
      return { lines: [`(${mark}) ${label}`], w: label.length + 4, h: 1 };
    },
  },
  dropdown: {
    label: "Dropdown",
    category: "ui",
    icon: "▾",
    create: (text = "Select option", width = 28) => {
      const top = "┌" + "─".repeat(width - 2) + "┐";
      const inner = text.padEnd(width - 6);
      const mid = "│ " + inner + " ▾ │";
      const bot = "└" + "─".repeat(width - 2) + "┘";
      return { lines: [top, mid, bot], w: width, h: 3 };
    },
  },
  textarea: {
    label: "Textarea",
    category: "ui",
    icon: "▤",
    create: (width = 30, height = 6) => {
      const lines = [];
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      for (let i = 0; i < height - 2; i++) {
        lines.push("│" + " ".repeat(width - 2) + "│");
      }
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: height };
    },
  },
  nav: {
    label: "Navbar",
    category: "layout",
    icon: "☰",
    create: (brand = "Logo", links = ["Home", "About", "Contact"], width = 70) => {
      const linkStr = links.join("   ");
      const top = "┌" + "─".repeat(width - 2) + "┐";
      const pad = width - 4 - brand.length - linkStr.length;
      const mid = "│ " + brand + " ".repeat(Math.max(pad, 2)) + linkStr + " │";
      const bot = "└" + "─".repeat(width - 2) + "┘";
      return { lines: [top, mid, bot], w: width, h: 3 };
    },
  },
  sidebar: {
    label: "Sidebar",
    category: "layout",
    icon: "▮",
    create: (items = ["Dashboard", "Users", "Settings", "Reports"], width = 22, height = 20) => {
      const lines = [];
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      lines.push("│ " + "≡ Menu".padEnd(width - 4) + " │");
      lines.push("├" + "─".repeat(width - 2) + "┤");
      items.forEach((item) => {
        lines.push("│ " + item.padEnd(width - 4) + " │");
      });
      const remaining = height - 3 - items.length - 1;
      for (let i = 0; i < remaining; i++) {
        lines.push("│" + " ".repeat(width - 2) + "│");
      }
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: height };
    },
  },
  header: {
    label: "Header",
    category: "layout",
    icon: "▬",
    create: (title = "Page Title", subtitle = "Description text here", width = 60) => {
      const lines = [];
      lines.push("═".repeat(width));
      lines.push(" " + title);
      lines.push(" " + subtitle);
      lines.push("═".repeat(width));
      return { lines, w: width, h: 4 };
    },
  },
  breadcrumb: {
    label: "Breadcrumb",
    category: "layout",
    icon: "»",
    create: (items = ["Home", "Products", "Detail"]) => {
      const text = items.join(" > ");
      return { lines: [text], w: text.length, h: 1 };
    },
  },
  pagination: {
    label: "Pagination",
    category: "ui",
    icon: "…",
    create: () => {
      const text = "< [1] [2] [3] ... [10] >";
      return { lines: [text], w: text.length, h: 1 };
    },
  },
  avatar: {
    label: "Avatar",
    category: "ui",
    icon: "◯",
    create: (name = "JD") => {
      return {
        lines: ["┌──┐", "│" + name.substring(0, 2).padEnd(2) + "│", "└──┘"],
        w: 4,
        h: 3,
      };
    },
  },
  badge: {
    label: "Badge",
    category: "ui",
    icon: "◆",
    create: (text = "NEW") => {
      return { lines: [`(${text})`], w: text.length + 2, h: 1 };
    },
  },
  divider: {
    label: "Divider",
    category: "draw",
    icon: "─",
    create: (width = 40) => {
      return { lines: ["─".repeat(width)], w: width, h: 1 };
    },
  },
  hline: {
    label: "H-Line",
    category: "draw",
    icon: "━",
    create: (width = 40) => {
      return { lines: ["━".repeat(width)], w: width, h: 1 };
    },
  },
  arrow_right: {
    label: "Arrow →",
    category: "draw",
    icon: "→",
    create: (width = 10) => {
      return { lines: ["─".repeat(width - 1) + "→"], w: width, h: 1 };
    },
  },
  arrow_down: {
    label: "Arrow ↓",
    category: "draw",
    icon: "↓",
    create: (height = 5) => {
      const lines = [];
      for (let i = 0; i < height - 1; i++) lines.push("│");
      lines.push("↓");
      return { lines, w: 1, h: height };
    },
  },
  box: {
    label: "Box",
    category: "draw",
    icon: "□",
    create: (width = 20, height = 6) => {
      const lines = [];
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      for (let i = 0; i < height - 2; i++) {
        lines.push("│" + " ".repeat(width - 2) + "│");
      }
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: height };
    },
  },
  text: {
    label: "Text",
    category: "basics",
    icon: "T",
    create: (content = "Label text") => {
      return { lines: [content], w: content.length, h: 1 };
    },
  },
  heading: {
    label: "Heading",
    category: "basics",
    icon: "H",
    create: (content = "Heading") => {
      return { lines: ["# " + content], w: content.length + 2, h: 1 };
    },
  },
  paragraph: {
    label: "Paragraph",
    category: "basics",
    icon: "¶",
    create: (width = 40) => {
      const lines = [
        "Lorem ipsum dolor sit amet,".padEnd(width).substring(0, width),
        "consectetur adipiscing elit.".padEnd(width).substring(0, width),
        "Sed do eiusmod tempor.".padEnd(width).substring(0, width),
      ];
      return { lines, w: width, h: 3 };
    },
  },
  toggle: {
    label: "Toggle",
    category: "ui",
    icon: "⊘",
    create: (label = "Feature", on = false) => {
      const sw = on ? "[===●]" : "[●===]";
      return { lines: [`${sw} ${label}`], w: label.length + 7, h: 1 };
    },
  },
  progress: {
    label: "Progress",
    category: "ui",
    icon: "▰",
    create: (pct = 60, width = 30) => {
      const filled = Math.round(((width - 2) * pct) / 100);
      const empty = width - 2 - filled;
      return {
        lines: ["[" + "█".repeat(filled) + "░".repeat(empty) + "]"],
        w: width,
        h: 1,
      };
    },
  },
  image: {
    label: "Image",
    category: "ui",
    icon: "🖼",
    create: (width = 20, height = 8) => {
      const lines = [];
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      const midY = Math.floor((height - 2) / 2);
      for (let i = 0; i < height - 2; i++) {
        if (i === midY) {
          const txt = "[image]";
          const pad = width - 2 - txt.length;
          const left = Math.floor(pad / 2);
          const right = pad - left;
          lines.push("│" + " ".repeat(left) + txt + " ".repeat(right) + "│");
        } else if (i === midY - 1 || i === midY + 1) {
          const slash = i === midY - 1 ? "/" : "\\";
          const pad = width - 2;
          const mid = Math.floor(pad / 2);
          const line = " ".repeat(mid - 1) + slash + " ".repeat(pad - mid);
          lines.push("│" + line + "│");
        } else {
          lines.push("│" + " ".repeat(width - 2) + "│");
        }
      }
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: height };
    },
  },
};

const CATEGORIES = {
  basics: { label: "Basics", color: "#8b9dc3" },
  ui: { label: "UI Elements", color: "#dda15e" },
  layout: { label: "Layout", color: "#6b9080" },
  draw: { label: "Draw", color: "#b5838d" },
};

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

function bufferToMarkdown(buffer, trimEmpty = true) {
  let lines = [...buffer];
  if (trimEmpty) {
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
    while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  }
  let minIndent = Infinity;
  lines.forEach((l) => {
    if (l.trim().length > 0) {
      const spaces = l.match(/^( *)/)[1].length;
      minIndent = Math.min(minIndent, spaces);
    }
  });
  if (minIndent === Infinity) minIndent = 0;
  lines = lines.map((l) => l.substring(minIndent).trimEnd());
  return "```\n" + lines.join("\n") + "\n```";
}

// ─── Main App ─────────────────────────────────────────────────
export default function WireframeEditor() {
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select"); // select | place
  const [placingTemplate, setPlacingTemplate] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [cursorPos, setCursorPos] = useState({ col: 0, row: 0 });
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownText, setMarkdownText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState(null);
  const [canvasCols, setCanvasCols] = useState(COLS);
  const [canvasRows, setCanvasRows] = useState(ROWS);
  const [zoom, setZoom] = useState(1);
  const [panelTab, setPanelTab] = useState("components");
  const canvasRef = useRef(null);

  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) || null,
    [objects, selectedId]
  );

  const buffer = useMemo(
    () => renderAllObjects(objects, canvasCols, canvasRows),
    [objects, canvasCols, canvasRows]
  );

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

      // Select mode
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
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, objects, notify]);

  // ─── Export markdown ──────────────────────────────────────
  const exportMarkdown = useCallback(() => {
    const md = bufferToMarkdown(buffer);
    setMarkdownText(md);
    setShowMarkdown(true);
  }, [buffer]);

  const copyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(markdownText).then(() => notify("Copied to clipboard!"));
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

  // ─── Layer operations ─────────────────────────────────────
  const moveLayer = useCallback(
    (dir) => {
      if (!selectedId) return;
      setObjects((prev) => {
        const idx = prev.findIndex((o) => o.id === selectedId);
        if (idx < 0) return prev;
        const arr = [...prev];
        const swap = dir === "up" ? idx + 1 : idx - 1;
        if (swap < 0 || swap >= arr.length) return prev;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        return arr;
      });
    },
    [selectedId]
  );

  // ─── Template placement ───────────────────────────────────
  const startPlace = useCallback((templateKey) => {
    setTool("place");
    setPlacingTemplate(templateKey);
    setSelectedId(null);
  }, []);

  // ─── Canvas rendering ────────────────────────────────────
  const canvasWidth = canvasCols * CELL_W;
  const canvasHeight = canvasRows * CELL_H;

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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        background: "#0f0f12",
        color: "#d4d4d8",
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
          borderBottom: "1px solid #27272a",
          background: "#18181b",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5", letterSpacing: -0.5 }}>
            ◻ Wiredown
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              background: "#3f3f46",
              borderRadius: 4,
              color: "#a1a1aa",
            }}
          >
            ASCII Wireframes
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowHelp(true)} style={topBtnStyle}>? Help</button>
          <button onClick={() => setShowImport(true)} style={topBtnStyle}>↓ Import</button>
          <button onClick={exportMarkdown} style={{ ...topBtnStyle, background: "#3b82f6", color: "#fff" }}>
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
            borderRight: "1px solid #27272a",
            background: "#18181b",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {/* Panel Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #27272a" }}>
            {["components", "layers"].map((tab) => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  border: "none",
                  background: panelTab === tab ? "#27272a" : "transparent",
                  color: panelTab === tab ? "#f4f4f5" : "#71717a",
                  fontSize: 11,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {panelTab === "components" &&
              Object.entries(CATEGORIES).map(([catKey, cat]) => (
                <div key={catKey} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      padding: "4px 12px",
                      fontSize: 10,
                      color: cat.color,
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
                              : "1px solid #3f3f46",
                          borderRadius: 4,
                          background:
                            placingTemplate === tmpl.key ? "#1e3a5f" : "#27272a",
                          color: "#d4d4d8",
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

            {panelTab === "layers" && (
              <div style={{ padding: "0 8px" }}>
                {objects.length === 0 && (
                  <div style={{ color: "#52525b", fontSize: 12, padding: 12, textAlign: "center" }}>
                    No objects yet.
                    <br />
                    Click a component to place it.
                  </div>
                )}
                {[...objects].reverse().map((obj, i) => (
                  <div
                    key={obj.id}
                    onClick={() => { setSelectedId(obj.id); setTool("select"); }}
                    style={{
                      padding: "6px 8px",
                      marginBottom: 2,
                      borderRadius: 4,
                      cursor: "pointer",
                      background: obj.id === selectedId ? "#1e3a5f" : "transparent",
                      border: obj.id === selectedId ? "1px solid #3b82f6" : "1px solid transparent",
                      fontSize: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      {TEMPLATES[obj.type]?.icon || "◇"}{" "}
                      {TEMPLATES[obj.type]?.label || obj.type}
                    </span>
                    <span style={{ color: "#52525b", fontSize: 10 }}>
                      ({obj.x},{obj.y})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Canvas ────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", position: "relative", background: "#0f0f12" }}>
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
              background: "#18181bdd",
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid #27272a",
              fontSize: 12,
            }}
          >
            <button
              onClick={() => { setTool("select"); setPlacingTemplate(null); }}
              style={{
                ...toolBtnStyle,
                background: tool === "select" ? "#3b82f6" : "#27272a",
                color: tool === "select" ? "#fff" : "#a1a1aa",
              }}
            >
              ◇ Select
            </button>
            <span style={{ color: "#3f3f46" }}>│</span>
            <span style={{ color: "#52525b" }}>
              Ln {cursorPos.row + 1}, Col {cursorPos.col + 1}
            </span>
            <span style={{ color: "#3f3f46" }}>│</span>
            <span style={{ color: "#52525b" }}>
              {canvasCols}×{canvasRows}
            </span>
            <span style={{ color: "#3f3f46" }}>│</span>
            <span style={{ color: "#52525b" }}>{objects.length} objects</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} style={toolBtnStyle}>
              −
            </button>
            <span style={{ color: "#a1a1aa", minWidth: 40, textAlign: "center" }}>
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
                    stroke="#1a1a1f"
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
                  border: "2px solid #3b82f6",
                  borderRadius: 2,
                  pointerEvents: "none",
                  boxShadow: "0 0 12px #3b82f620",
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
                color: "#e4e4e7",
                pointerEvents: "none",
                userSelect: "none",
                whiteSpace: "pre",
              }}
            >
              {buffer.join("\n")}
            </pre>
          </div>
        </div>

        {/* ─── Right Panel (Inspector) ───────────────────── */}
        <div
          style={{
            width: 220,
            borderLeft: "1px solid #27272a",
            background: "#18181b",
            flexShrink: 0,
            overflow: "auto",
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "#71717a",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Inspector
          </div>

          {selectedObj ? (
            <div style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 12, color: "#a1a1aa" }}>
                <strong style={{ color: "#f4f4f5" }}>
                  {TEMPLATES[selectedObj.type]?.icon || "◇"}{" "}
                  {TEMPLATES[selectedObj.type]?.label || selectedObj.type}
                </strong>
              </div>

              <label style={labelStyle}>Position X</label>
              <input
                type="number"
                value={selectedObj.x}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setObjects((prev) =>
                    prev.map((o) => (o.id === selectedId ? { ...o, x: val } : o))
                  );
                }}
                style={inputStyle}
              />

              <label style={labelStyle}>Position Y</label>
              <input
                type="number"
                value={selectedObj.y}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setObjects((prev) =>
                    prev.map((o) => (o.id === selectedId ? { ...o, y: val } : o))
                  );
                }}
                style={inputStyle}
              />

              <div style={{ color: "#52525b", fontSize: 11, marginTop: 8 }}>
                Size: {selectedObj.data.w}×{selectedObj.data.h}
              </div>

              <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
                <button onClick={() => moveLayer("up")} style={inspBtnStyle}>
                  ↑ Up
                </button>
                <button onClick={() => moveLayer("down")} style={inspBtnStyle}>
                  ↓ Down
                </button>
              </div>
              <button
                onClick={() => {
                  const obj = objects.find((o) => o.id === selectedId);
                  if (obj) {
                    const dup = { ...obj, id: uid(), x: obj.x + 2, y: obj.y + 2, data: { ...obj.data, lines: [...obj.data.lines] } };
                    setObjects((prev) => [...prev, dup]);
                    setSelectedId(dup.id);
                    notify("Duplicated");
                  }
                }}
                style={{ ...inspBtnStyle, width: "100%", marginTop: 4 }}
              >
                ⊕ Duplicate
              </button>
              <button
                onClick={() => {
                  setObjects((prev) => prev.filter((o) => o.id !== selectedId));
                  setSelectedId(null);
                  notify("Deleted");
                }}
                style={{ ...inspBtnStyle, width: "100%", marginTop: 4, borderColor: "#7f1d1d", color: "#f87171" }}
              >
                ✕ Delete
              </button>
            </div>
          ) : (
            <div style={{ color: "#52525b", fontSize: 12 }}>
              Select an object to inspect, or click a component to place it on the canvas.
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "#71717a",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Quick Actions
            </div>
            <button
              onClick={() => {
                if (objects.length > 0 && confirm("Clear all objects?")) {
                  setObjects([]);
                  setSelectedId(null);
                  notify("Canvas cleared");
                }
              }}
              style={{ ...inspBtnStyle, width: "100%", marginBottom: 4 }}
            >
              ⌫ Clear All
            </button>
            <button onClick={exportMarkdown} style={{ ...inspBtnStyle, width: "100%" }}>
              📋 Copy Markdown
            </button>
          </div>

          {/* Keyboard shortcuts */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "#71717a",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Shortcuts
            </div>
            <div style={{ fontSize: 11, color: "#52525b", lineHeight: 1.8 }}>
              <div><kbd style={kbdStyle}>Del</kbd> Delete</div>
              <div><kbd style={kbdStyle}>Esc</kbd> Deselect</div>
              <div><kbd style={kbdStyle}>⌘D</kbd> Duplicate</div>
            </div>
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
          borderTop: "1px solid #27272a",
          background: "#18181b",
          fontSize: 11,
          color: "#52525b",
          flexShrink: 0,
        }}
      >
        <span>
          {tool === "place"
            ? `Placing: ${TEMPLATES[placingTemplate]?.label || "?"} — click canvas to drop`
            : "Select mode — click objects to move them"}
        </span>
        <span>Wiredown v1.0 — AI-friendly ASCII wireframes</span>
      </div>

      {/* ─── Notification ────────────────────────────────── */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: 44,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#27272a",
            color: "#f4f4f5",
            padding: "8px 20px",
            borderRadius: 6,
            fontSize: 13,
            zIndex: 1000,
            border: "1px solid #3f3f46",
            boxShadow: "0 4px 20px #00000060",
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
              <h3 style={{ margin: 0, color: "#f4f4f5", fontSize: 16 }}>Markdown Export</h3>
              <button onClick={() => setShowMarkdown(false)} style={closeBtnStyle}>✕</button>
            </div>
            <p style={{ color: "#71717a", fontSize: 12, margin: "0 0 8px" }}>
              Paste this into Claude Code, Cursor, or any AI tool. The wireframe is wrapped in a code block for clarity.
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
              <h3 style={{ margin: 0, color: "#f4f4f5", fontSize: 16 }}>Import Wireframe</h3>
              <button onClick={() => setShowImport(false)} style={closeBtnStyle}>✕</button>
            </div>
            <p style={{ color: "#71717a", fontSize: 12, margin: "0 0 8px" }}>
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
                  background: importText.trim() ? "#3b82f6" : "#27272a",
                  borderColor: importText.trim() ? "#3b82f6" : "#3f3f46",
                  color: importText.trim() ? "#fff" : "#52525b",
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
              <h3 style={{ margin: 0, color: "#f4f4f5", fontSize: 16 }}>◻ Wiredown — Help</h3>
              <button onClick={() => setShowHelp(false)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: "#f4f4f5" }}>What is this?</strong><br/>
                An ASCII wireframe editor for designing UI mockups that AI tools can understand. Export your designs as Markdown and paste them into Claude, Cursor, or any LLM.
              </p>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: "#f4f4f5" }}>How to use:</strong><br/>
                1. Click a component in the left panel to select it<br/>
                2. Click on the canvas to place it<br/>
                3. Switch to Select mode and drag objects to reposition<br/>
                4. Export → paste the markdown into your AI coding tool
              </p>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: "#f4f4f5" }}>CLI / AI Usage:</strong><br/>
                You can also write wireframes directly in ASCII and import them here. AI assistants can generate wireframe markdown that you can import, or you can export your designs for AI to implement.
              </p>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: "#f4f4f5" }}>Keyboard Shortcuts:</strong><br/>
                <kbd style={kbdStyle}>Del</kbd> Delete selected · <kbd style={kbdStyle}>Esc</kbd> Deselect / close · <kbd style={kbdStyle}>⌘D</kbd> Duplicate
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #18181b; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────
const topBtnStyle = {
  padding: "6px 12px",
  border: "1px solid #3f3f46",
  borderRadius: 5,
  background: "#27272a",
  color: "#d4d4d8",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
};

const toolBtnStyle = {
  padding: "4px 10px",
  border: "1px solid #3f3f46",
  borderRadius: 4,
  background: "#27272a",
  color: "#a1a1aa",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
};

const inspBtnStyle = {
  padding: "6px 10px",
  border: "1px solid #3f3f46",
  borderRadius: 4,
  background: "#27272a",
  color: "#d4d4d8",
  fontSize: 11,
  fontFamily: "inherit",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  fontSize: 10,
  color: "#71717a",
  textTransform: "uppercase",
  letterSpacing: 1,
  marginBottom: 4,
  marginTop: 10,
};

const inputStyle = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #3f3f46",
  borderRadius: 4,
  background: "#27272a",
  color: "#f4f4f5",
  fontSize: 13,
  fontFamily: "inherit",
};

const kbdStyle = {
  display: "inline-block",
  padding: "1px 5px",
  border: "1px solid #3f3f46",
  borderRadius: 3,
  background: "#27272a",
  fontSize: 10,
  fontFamily: "inherit",
  marginRight: 4,
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "#000000aa",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  backdropFilter: "blur(4px)",
};

const modalStyle = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: 24,
  width: "90%",
  maxWidth: 480,
  maxHeight: "80vh",
  overflow: "auto",
  boxShadow: "0 20px 60px #00000080",
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  color: "#71717a",
  fontSize: 18,
  cursor: "pointer",
  padding: "4px 8px",
};

const textareaStyle = {
  width: "100%",
  height: 240,
  padding: 12,
  border: "1px solid #3f3f46",
  borderRadius: 6,
  background: "#0f0f12",
  color: "#e4e4e7",
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  resize: "vertical",
  lineHeight: 1.5,
};
