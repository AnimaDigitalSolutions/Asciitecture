import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { TEMPLATES, CATEGORIES } from "./lib/templates";
import { DIAGRAM_TEMPLATES, DIAGRAM_CATEGORIES } from "./lib/diagram-templates";
import { Storage } from "./lib/storage";
import { exportMarkdown, copyToClipboard, downloadFile } from "./lib/export";

// ─── Constants ────────────────────────────────────────────────
const CELL_W = 12.5;
const CELL_H = 22.5;
const COLS = 100;
const ROWS = 50;

// ─── Feature Flags ────────────────────────────────────────────
const TABS_ENABLED = import.meta.env.VITE_FEATURE_TABS === 'true';

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
  const [selectedId, setSelectedId] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isUndoing, setIsUndoing] = useState(false);
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
  const [mode, setMode] = useState(() => {
    // Load mode from localStorage or default to web
    return localStorage.getItem('asciitecture_mode') || 'web';
  });
  // Tab state (only used if TABS_ENABLED)
  const [tabs, setTabs] = useState(TABS_ENABLED ? [{ id: 1, name: 'Tab 1', objects: [] }] : null);
  const [activeTab, setActiveTab] = useState(1);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState('');
  
  // Simple objects state (used when tabs are disabled)
  const [simpleObjects, setSimpleObjects] = useState([]);
  
  const canvasRef = useRef(null);
  
  // Get objects based on whether tabs are enabled
  const objects = useMemo(() => {
    if (TABS_ENABLED) {
      const currentTab = tabs?.find(tab => tab.id === activeTab) || tabs?.[0];
      return currentTab?.objects || [];
    }
    return simpleObjects;
  }, [tabs, activeTab, simpleObjects]);
  
  // Update objects based on whether tabs are enabled
  const setObjects = useCallback((newObjects) => {
    if (TABS_ENABLED) {
      setTabs(prevTabs => prevTabs.map(tab => 
        tab.id === activeTab 
          ? { ...tab, objects: typeof newObjects === 'function' ? newObjects(tab.objects) : newObjects }
          : tab
      ));
    } else {
      setSimpleObjects(typeof newObjects === 'function' ? newObjects : newObjects);
    }
  }, [activeTab]);

  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) || null,
    [objects, selectedId]
  );

  // ─── Undo/Redo Management ─────────────────────────────────
  const saveToHistory = useCallback((currentObjects) => {
    if (!isUndoing) {
      setUndoStack(prev => [...prev.slice(-19), currentObjects]); // Keep last 20 states
      setRedoStack([]); // Clear redo stack on new action
    }
  }, [isUndoing]);

  const setObjectsWithHistory = useCallback((newObjects) => {
    if (!isUndoing) {
      saveToHistory(objects);
    }
    setObjects(newObjects);
  }, [objects, saveToHistory, isUndoing, setObjects]);

  // ─── Notification helper ──────────────────────────────────
  const notify = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      setIsUndoing(true);
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [objects, ...prev]);
      setUndoStack(prev => prev.slice(0, -1));
      setObjects(previousState);
      setSelectedId(null);
      notify("Undone");
      setTimeout(() => setIsUndoing(false), 10);
    }
  }, [undoStack, objects, setObjects, notify]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      setIsUndoing(true);
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, objects]);
      setRedoStack(prev => prev.slice(1));
      setObjects(nextState);
      setSelectedId(null);
      notify("Redone");
      setTimeout(() => setIsUndoing(false), 10);
    }
  }, [redoStack, objects, setObjects, notify]);

  // ─── Mobile Detection ─────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 960);
      if (window.innerWidth > 960) {
        setShowMobileMenu(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // ─── Mode handling ────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('asciitecture_mode', mode);
  }, [mode]);
  
  // ─── Tab management ───────────────────────────────────────
  const addTab = useCallback(() => {
    if (!TABS_ENABLED) return;
    if (tabs.length >= 3) {
      setNotification("Only 3 tabs are supported");
      setTimeout(() => setNotification(null), 2500);
      return;
    }
    const newId = Math.max(...tabs.map(t => t.id)) + 1;
    setTabs(prev => [...prev, { id: newId, name: `Tab ${newId}`, objects: [] }]);
    setActiveTab(newId);
  }, [tabs]);
  
  const deleteTab = useCallback((tabId) => {
    if (!TABS_ENABLED) return;
    if (tabs.length === 1) {
      // Clear the only tab instead of deleting
      setTabs([{ id: 1, name: 'Tab 1', objects: [] }]);
      setSelectedId(null);
      setNotification("Tab cleared");
      setTimeout(() => setNotification(null), 2500);
      return;
    }
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab(tabs.find(t => t.id !== tabId)?.id || 1);
    }
    setSelectedId(null);
    setNotification("Tab deleted");
    setTimeout(() => setNotification(null), 2500);
  }, [tabs, activeTab]);
  
  const startRenamingTab = useCallback((tabId, currentName) => {
    if (!TABS_ENABLED) return;
    setEditingTabId(tabId);
    setEditingTabName(currentName);
  }, []);
  
  const finishRenamingTab = useCallback(() => {
    if (!TABS_ENABLED) return;
    if (editingTabId !== null && editingTabName.trim()) {
      setTabs(prev => prev.map(tab => 
        tab.id === editingTabId 
          ? { ...tab, name: editingTabName.trim() }
          : tab
      ));
    }
    setEditingTabId(null);
    setEditingTabName('');
  }, [editingTabId, editingTabName]);
  
  const cancelRenamingTab = useCallback(() => {
    if (!TABS_ENABLED) return;
    setEditingTabId(null);
    setEditingTabName('');
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
        const templates = mode === 'diagram' ? DIAGRAM_TEMPLATES : TEMPLATES;
        const tmpl = templates[placingTemplate];
        if (tmpl) {
          const data = tmpl.create();
          const newObj = { id: uid(), type: placingTemplate, x: col, y: row, data, mode };
          setObjectsWithHistory((prev) => [...prev, newObj]);
          setSelectedId(newObj.id);
          setTool("select");
          setPlacingTemplate(null);
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
    [tool, placingTemplate, pixelToCell, hitTest, notify, mode, setObjectsWithHistory]
  );

  const handleCanvasMouseMove = useCallback(
    (e) => {
      const { col, row } = pixelToCell(e.clientX, e.clientY);
      setCursorPos({ col, row });

      if (dragState) {
        const dx = col - dragState.startCol;
        const dy = row - dragState.startRow;
        setObjectsWithHistory((prev) =>
          prev.map((o) =>
            o.id === dragState.id
              ? { ...o, x: Math.max(0, dragState.origX + dx), y: Math.max(0, dragState.origY + dy) }
              : o
          )
        );
      }
    },
    [dragState, pixelToCell, setObjectsWithHistory]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleCanvasDoubleClick = useCallback(
    (e) => {
      const { col, row } = pixelToCell(e.clientX, e.clientY);
      const hit = hitTest(col, row);
      if (hit) {
        const obj = objects.find(o => o.id === hit.id);
        if (obj && obj.data && obj.data.lines) {
          setEditingTextId(hit.id);
          setEditingText(obj.data.lines.join('\n'));
          setSelectedId(hit.id);
        }
      }
    },
    [pixelToCell, hitTest, objects, setEditingTextId, setEditingText, setSelectedId]
  );

  // ─── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          setObjectsWithHistory((prev) => prev.filter((o) => o.id !== selectedId));
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
        if (editingTextId) {
          setEditingTextId(null);
          setEditingText("");
        }
      }
      if (e.key === "Enter" && selectedId && !editingTextId) {
        const obj = objects.find((o) => o.id === selectedId);
        if (obj && obj.data && obj.data.lines) {
          setEditingTextId(selectedId);
          setEditingText(obj.data.lines.join('\n'));
        }
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedId) {
          const obj = objects.find((o) => o.id === selectedId);
          if (obj) {
            const dup = { ...obj, id: uid(), x: obj.x + 2, y: obj.y + 2, data: { ...obj.data, lines: [...obj.data.lines] } };
            setObjectsWithHistory((prev) => [...prev, dup]);
            setSelectedId(dup.id);
            notify("Duplicated");
          }
        }
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        notify("🚧 Share feature coming soon! Stay tuned...");
      }
      if (e.key === "c" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        if (objects.length === 0) {
          notify("Canvas is already empty");
          return;
        }
        setObjectsWithHistory([]);
        setSelectedId(null);
        setPlacingTemplate(null);
        notify("Canvas cleared");
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === "y" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, objects, notify, setObjectsWithHistory, setSelectedId, setPlacingTemplate, editingTextId, setEditingTextId, setEditingText, undo, redo]);

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

  // ─── Clear canvas ─────────────────────────────────────────
  const handleClearCanvas = useCallback(() => {
    if (objects.length === 0) {
      notify("Canvas is already empty");
      return;
    }
    setObjectsWithHistory([]);
    setSelectedId(null);
    setPlacingTemplate(null);
    notify("Canvas cleared");
  }, [objects.length, notify]);

  // ─── Text editing ─────────────────────────────────────────
  const startEditingText = useCallback((objId) => {
    const obj = objects.find(o => o.id === objId);
    if (obj && obj.data && obj.data.lines) {
      setEditingTextId(objId);
      setEditingText(obj.data.lines.join('\n'));
      setSelectedId(objId);
    }
  }, [objects]);

  const finishEditingText = useCallback(() => {
    if (editingTextId && editingText.trim()) {
      const lines = editingText.split('\n');
      const data = { 
        lines, 
        w: Math.max(...lines.map(l => l.length)), 
        h: lines.length 
      };
      setObjectsWithHistory(prev => prev.map(obj => 
        obj.id === editingTextId 
          ? { ...obj, data }
          : obj
      ));
      notify("Text updated");
    }
    setEditingTextId(null);
    setEditingText("");
  }, [editingTextId, editingText, notify]);

  const cancelEditingText = useCallback(() => {
    setEditingTextId(null);
    setEditingText("");
  }, []);

  // ─── Add text tool ────────────────────────────────────────
  const addTextObject = useCallback((col, row) => {
    const defaultText = "Edit me";
    const lines = [defaultText];
    const data = { lines, w: defaultText.length, h: 1 };
    const newObj = { id: uid(), type: "text", x: col, y: row, data };
    setObjectsWithHistory(prev => [...prev, newObj]);
    setSelectedId(newObj.id);
    // Start editing immediately
    setTimeout(() => startEditingText(newObj.id), 100);
    setTool("select");
    notify("Text added");
  }, [startEditingText, notify]);

  // ─── Import ────────────────────────────────────────────────
  const handleImport = useCallback(() => {
    let text = importText;
    text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
    const lines = text.split("\n");
    const data = { lines, w: Math.max(...lines.map((l) => l.length)), h: lines.length };
    const newObj = { id: uid(), type: "imported", x: 2, y: 2, data };
    setObjectsWithHistory((prev) => [...prev, newObj]);
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
    notify("🚧 Share feature coming soon! Stay tuned...");
  }, [notify]);

  // ─── Canvas rendering ────────────────────────────────────
  const canvasWidth = COLS * CELL_W;
  const canvasHeight = ROWS * CELL_H;

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups = {};
    const templates = mode === 'diagram' ? DIAGRAM_TEMPLATES : TEMPLATES;
    Object.entries(templates).forEach(([key, tmpl]) => {
      const cat = tmpl.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ key, ...tmpl });
    });
    return groups;
  }, [mode]);

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
    padding: "7.5px 15px",
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 6.25,
    background: colors.buttonBg,
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const toolBtnStyle = {
    padding: "5px 12.5px",
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 4,
    background: colors.buttonBg,
    color: colors.textMuted,
    fontSize: 15,
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
    fontSize: 13.75,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const kbdStyle = {
    display: "inline-block",
    padding: "1.25px 6.25px",
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 3.75,
    background: colors.buttonBg,
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: "inherit",
    marginRight: 5,
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
    borderRadius: 10,
    padding: 30,
    width: "90%",
    maxWidth: 600,
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: theme === 'light' ? "0 20px 60px #00000020" : "0 20px 60px #00000080",
  };

  const closeBtnStyle = {
    background: "none",
    border: "none",
    color: colors.textMuted,
    fontSize: 22.5,
    cursor: "pointer",
    padding: "5px 10px",
  };

  const textareaStyle = {
    width: "100%",
    height: 300,
    padding: 15,
    border: `1px solid ${colors.borderDark}`,
    borderRadius: 7.5,
    background: colors.inputBg,
    color: colors.text,
    fontSize: 15,
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
          height: 60,
          padding: "0 20px",
          borderBottom: `1px solid ${colors.border}`,
          background: colors.backgroundSecondary,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                ...topBtnStyle,
                padding: "8px",
                fontSize: 16,
                background: showMobileMenu ? colors.selection : colors.buttonBg,
                color: showMobileMenu ? "#fff" : colors.textMuted,
              }}
              title="Toggle menu"
            >
              ☰
            </button>
          )}
          <span style={{ fontSize: isMobile ? 20 : 22.5, fontWeight: 700, color: colors.text, letterSpacing: -0.5 }}>
            ◻ Asciitecture
          </span>
          {!isMobile && (
            <>
              <span
                style={{
                  fontSize: 12.5,
                  padding: "2.5px 7.5px",
                  background: colors.borderDark,
                  borderRadius: 6.25,
                  color: colors.textMuted,
                }}
              >
                ASCII Wireframes
              </span>
              <div style={{ display: 'flex', gap: 0, marginLeft: 8 }}>
                <button
                  onClick={() => setMode('web')}
                  style={{
                    padding: '2.5px 10px',
                    fontSize: 12.5,
                    border: `1px solid ${colors.borderDark}`,
                    borderTopLeftRadius: 4,
                    borderBottomLeftRadius: 4,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    background: mode === 'web' ? colors.selection : colors.buttonBg,
                    color: mode === 'web' ? '#fff' : colors.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    letterSpacing: 0.5,
                  }}
                >
                  WEB
                </button>
                <button
                  onClick={() => setMode('diagram')}
                  style={{
                    padding: '2.5px 10px',
                    fontSize: 12.5,
                    border: `1px solid ${colors.borderDark}`,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderTopRightRadius: 4,
                    borderBottomRightRadius: 4,
                    marginLeft: -1,
                    background: mode === 'diagram' ? colors.selection : colors.buttonBg,
                    color: mode === 'diagram' ? '#fff' : colors.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    letterSpacing: 0.5,
                  }}
                >
                  DIAGRAM
                </button>
              </div>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: isMobile ? 4 : 8, alignItems: "center" }}>
          {!isMobile && <button onClick={() => setShowHelp(true)} style={topBtnStyle}>? Help</button>}
          {!isMobile && (
            <button 
              onClick={handleShare} 
              style={{ 
                ...topBtnStyle, 
                opacity: 0.7,
                cursor: "not-allowed"
              }}
              title="Coming soon!"
            >
              ⇧ Share
            </button>
          )}
          {!isMobile && <button onClick={() => setShowImport(true)} style={topBtnStyle}>↓ Import</button>}
          <button onClick={handleExportMarkdown} style={{ 
            ...topBtnStyle, 
            background: "#3b82f6", 
            color: "#fff",
            fontSize: isMobile ? 11 : 12,
            padding: isMobile ? "4px 8px" : "6px 12px"
          }}>
            {isMobile ? "↑" : "↑ Export MD"}
          </button>
        </div>
      </div>

      {/* ─── Main Area ────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── Left Panel ────────────────────────────────── */}
        <div
          style={{
            width: isMobile ? (showMobileMenu ? "350px" : "0px") : 275,
            borderRight: `1px solid ${colors.border}`,
            background: colors.backgroundSecondary,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
            position: isMobile ? "fixed" : "static",
            top: isMobile ? 48 : "auto",
            left: 0,
            bottom: isMobile ? 0 : "auto",
            zIndex: isMobile ? 50 : "auto",
            transition: isMobile ? "width 0.3s ease" : "none",
            transform: isMobile ? (showMobileMenu ? "translateX(0)" : "translateX(-100%)") : "none",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
            {Object.entries(mode === 'diagram' ? DIAGRAM_CATEGORIES : CATEGORIES).map(([catKey, cat]) => (
              <div key={catKey} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    padding: "5px 15px",
                    fontSize: 12.5,
                    color: colors.categoryColors[catKey] || colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {cat.label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "0 10px" }}>
                  {(groupedTemplates[catKey] || []).map((tmpl) => (
                    <button
                      key={tmpl.key}
                      onClick={() => startPlace(tmpl.key)}
                      title={tmpl.label}
                      style={{
                        width: 117.5,
                        padding: "7.5px 5px",
                        border:
                          placingTemplate === tmpl.key
                            ? "1px solid #3b82f6"
                            : `1px solid ${colors.borderDark}`,
                        borderRadius: 6.25,
                        background:
                          placingTemplate === tmpl.key ? "#3b82f620" : colors.buttonBg,
                        color: colors.textSecondary,
                        fontSize: 13.75,
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
          
          {/* Mobile Mode Toggle */}
          {isMobile && (
            <div style={{ 
              borderTop: `1px solid ${colors.border}`,
              padding: '12px'
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 12.5,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 10
                }}>
                  Mode
                </div>
                <div style={{ display: 'flex', gap: 0 }}>
                  <button
                    onClick={() => setMode('web')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: 13.75,
                      border: `1px solid ${colors.borderDark}`,
                      borderTopLeftRadius: 4,
                      borderBottomLeftRadius: 4,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      background: mode === 'web' ? colors.selection : colors.buttonBg,
                      color: mode === 'web' ? '#fff' : colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    WEB
                  </button>
                  <button
                    onClick={() => setMode('diagram')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: 13.75,
                      border: `1px solid ${colors.borderDark}`,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                      marginLeft: -1,
                      background: mode === 'diagram' ? colors.selection : colors.buttonBg,
                      color: mode === 'diagram' ? '#fff' : colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    DIAGRAM
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 12.5,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 10
                }}>
                  Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => { setShowHelp(true); setShowMobileMenu(false); }} style={{
                    ...topBtnStyle,
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    ? Help
                  </button>
                  <button onClick={() => { setShowImport(true); setShowMobileMenu(false); }} style={{
                    ...topBtnStyle,
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    ↓ Import
                  </button>
                  <button onClick={() => { handleClearCanvas(); setShowMobileMenu(false); }} style={{
                    ...topBtnStyle,
                    width: '100%',
                    justifyContent: 'center',
                    color: objects.length === 0 ? colors.textMuted : "#ef4444",
                    opacity: objects.length === 0 ? 0.5 : 1,
                  }}
                  disabled={objects.length === 0}>
                    🗑 Clear Canvas
                  </button>
                </div>
              </div>
            </div>
          )}

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
                borderRadius: 7.5,
                background: colors.buttonBg,
                color: colors.textSecondary,
                fontSize: 15,
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

        {/* ─── Mobile Overlay ──────────────────────────────── */}
        {isMobile && showMobileMenu && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: theme === 'light' ? "#00000044" : "#000000aa",
              zIndex: 40,
            }}
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* ─── Canvas ────────────────────────────────────── */}
        <div style={{ 
          flex: 1, 
          overflow: "auto", 
          position: "relative", 
          background: colors.canvas,
          marginLeft: isMobile ? 0 : "auto"
        }}>
          {/* Toolbar strip */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 4 : 8,
              padding: isMobile ? "4px 8px" : "6px 12px",
              background: theme === 'light' ? "#f9fafbdd" : "#18181bdd",
              backdropFilter: "blur(8px)",
              borderBottom: `1px solid ${colors.border}`,
              fontSize: isMobile ? 11 : 12,
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}
          >
            <button
              onClick={() => { setTool("select"); setPlacingTemplate(null); }}
              style={{
                ...toolBtnStyle,
                background: tool === "select" ? "#3b82f6" : colors.buttonBg,
                color: tool === "select" ? "#fff" : colors.textMuted,
                padding: isMobile ? "3px 6px" : "4px 10px",
                fontSize: isMobile ? 10 : 12,
              }}
            >
              {isMobile ? "◇" : "◇ Select"}
            </button>
            <button
              onClick={handleClearCanvas}
              style={{
                ...toolBtnStyle,
                background: colors.buttonBg,
                color: objects.length === 0 ? colors.textMuted : "#ef4444",
                padding: isMobile ? "3px 6px" : "4px 10px",
                fontSize: isMobile ? 10 : 12,
                opacity: objects.length === 0 ? 0.5 : 1,
              }}
              title="Clear all objects"
              disabled={objects.length === 0}
            >
              {isMobile ? "🗑" : "🗑 Clear"}
            </button>
            <span style={{ color: colors.borderDark }}>│</span>
            
            {/* Tab UI - only shown if TABS_ENABLED */}
            {TABS_ENABLED && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {tabs.map((tab, index) => (
                    <div key={tab.id} style={{ display: "flex", alignItems: "center" }}>
                      {editingTabId === tab.id ? (
                        <input
                          type="text"
                          value={editingTabName}
                          onChange={(e) => setEditingTabName(e.target.value)}
                          onBlur={cancelRenamingTab}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishRenamingTab();
                            if (e.key === 'Escape') cancelRenamingTab();
                          }}
                          style={{
                            ...toolBtnStyle,
                            padding: isMobile ? "3px 6px" : "4px 8px",
                            background: colors.inputBg,
                            color: colors.text,
                            borderRadius: tabs.length > 1 ? "4px 0 0 4px" : 4,
                            marginRight: tabs.length > 1 ? 0 : 4,
                            width: isMobile ? 60 : 80,
                            outline: 'none',
                            border: `2px solid ${colors.selection}`,
                            fontSize: isMobile ? 10 : 11,
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          onDoubleClick={() => startRenamingTab(tab.id, tab.name)}
                          style={{
                            ...toolBtnStyle,
                            padding: isMobile ? "3px 6px" : "4px 8px",
                            background: activeTab === tab.id ? colors.selection : colors.buttonBg,
                            color: activeTab === tab.id ? "#fff" : colors.textMuted,
                            borderRadius: tabs.length > 1 ? "4px 0 0 4px" : 4,
                            marginRight: tabs.length > 1 ? 0 : 4,
                            minWidth: isMobile ? 40 : 60,
                            fontSize: isMobile ? 10 : 11,
                          }}
                          title="Double-click to rename"
                        >
                          {tab.name}
                        </button>
                      )}
                      {tabs.length > 1 && (
                        <button
                          onClick={() => deleteTab(tab.id)}
                          style={{
                            ...toolBtnStyle,
                            padding: isMobile ? "3px 4px" : "4px 6px",
                            background: activeTab === tab.id ? colors.selection : colors.buttonBg,
                            color: activeTab === tab.id ? "#fff" : colors.textMuted,
                            borderRadius: "0 4px 4px 0",
                            borderLeft: "none",
                            fontSize: isMobile ? 9 : 10,
                            marginRight: index < tabs.length - 1 ? (isMobile ? 2 : 4) : 0,
                          }}
                          title="Delete tab"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {tabs.length < 3 && (
                    <button
                      onClick={addTab}
                      style={{
                        ...toolBtnStyle,
                        padding: isMobile ? "3px 6px" : "4px 8px",
                        background: colors.buttonBg,
                        color: colors.textMuted,
                        fontSize: isMobile ? 12 : 14,
                        fontWeight: "bold",
                        marginLeft: isMobile ? 2 : 4,
                      }}
                      title="Add new tab"
                    >
                      +
                    </button>
                  )}
                </div>
                <span style={{ color: colors.borderDark }}>│</span>
              </>
            )}
            {!isMobile && (
              <>
                <span style={{ color: colors.textMuted }}>
                  Ln {cursorPos.row + 1}, Col {cursorPos.col + 1}
                </span>
                <span style={{ color: colors.borderDark }}>│</span>
              </>
            )}
            <span style={{ color: colors.textMuted }}>
              {isMobile ? `${objects.length}` : `${objects.length} objects`}
            </span>
            <div style={{ flex: 1 }} />
            <button 
              onClick={undo}
              disabled={undoStack.length === 0}
              style={{
                ...toolBtnStyle,
                padding: isMobile ? "3px 6px" : "4px 10px",
                fontSize: isMobile ? 10 : 12,
                opacity: undoStack.length === 0 ? 0.5 : 1,
                cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
              }}
              title={`Undo${undoStack.length > 0 ? ` (${undoStack.length})` : ''}`}
            >
              {isMobile ? "↶" : "↶ Undo"}
            </button>
            <button 
              onClick={redo}
              disabled={redoStack.length === 0}
              style={{
                ...toolBtnStyle,
                padding: isMobile ? "3px 6px" : "4px 10px",
                fontSize: isMobile ? 10 : 12,
                opacity: redoStack.length === 0 ? 0.5 : 1,
                cursor: redoStack.length === 0 ? "not-allowed" : "pointer",
                marginRight: isMobile ? 2 : 4,
              }}
              title={`Redo${redoStack.length > 0 ? ` (${redoStack.length})` : ''}`}
            >
              {isMobile ? "↷" : "↷ Redo"}
            </button>
            <button 
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} 
              style={{
                ...toolBtnStyle,
                padding: isMobile ? "3px 6px" : "4px 10px",
                fontSize: isMobile ? 10 : 12,
              }}
            >
              −
            </button>
            {!isMobile && (
              <span style={{ color: colors.textMuted, minWidth: 40, textAlign: "center" }}>
                {Math.round(zoom * 100)}%
              </span>
            )}
            <button 
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))} 
              style={{
                ...toolBtnStyle,
                padding: isMobile ? "3px 6px" : "4px 10px",
                fontSize: isMobile ? 10 : 12,
              }}
            >
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
            onDoubleClick={handleCanvasDoubleClick}
            style={{
              width: canvasWidth * zoom,
              height: canvasHeight * zoom,
              position: "relative",
              cursor: tool === "place" ? "crosshair" : dragState ? "grabbing" : "default",
              margin: 25,
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
                fontSize: 17.5 * zoom,
                lineHeight: `${CELL_H * zoom}px`,
                letterSpacing: CELL_W * zoom - 17.5 * zoom * 0.6 + "px",
                fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                color: theme === 'light' ? '#111827' : '#e4e4e7',
                pointerEvents: "none",
                userSelect: "none",
                whiteSpace: "pre",
              }}
            >
              {buffer.join("\n")}
            </pre>
            
            {/* Text editing overlay */}
            {editingTextId && (
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => {
                  if (editingTextId && editingText.trim()) {
                    const lines = editingText.split('\n');
                    const data = { 
                      lines, 
                      w: Math.max(...lines.map(l => l.length)), 
                      h: lines.length 
                    };
                    setObjectsWithHistory(prev => prev.map(obj => 
                      obj.id === editingTextId 
                        ? { ...obj, data }
                        : obj
                    ));
                    notify("Text updated");
                  }
                  setEditingTextId(null);
                  setEditingText("");
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    if (editingTextId && editingText.trim()) {
                      const lines = editingText.split('\n');
                      const data = { 
                        lines, 
                        w: Math.max(...lines.map(l => l.length)), 
                        h: lines.length 
                      };
                      setObjectsWithHistory(prev => prev.map(obj => 
                        obj.id === editingTextId 
                          ? { ...obj, data }
                          : obj
                      ));
                      notify("Text updated");
                    }
                    setEditingTextId(null);
                    setEditingText("");
                  } else if (e.key === 'Escape') {
                    setEditingTextId(null);
                    setEditingText("");
                  }
                }}
                style={{
                  position: 'absolute',
                  left: (objects.find(o => o.id === editingTextId)?.x || 0) * CELL_W * zoom,
                  top: (objects.find(o => o.id === editingTextId)?.y || 0) * CELL_H * zoom,
                  width: Math.max(100, (objects.find(o => o.id === editingTextId)?.data?.w || 10) * CELL_W * zoom),
                  height: Math.max(20, (objects.find(o => o.id === editingTextId)?.data?.h || 1) * CELL_H * zoom),
                  fontSize: 17.5 * zoom,
                  fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                  lineHeight: `${CELL_H * zoom}px`,
                  letterSpacing: CELL_W * zoom - 17.5 * zoom * 0.6 + "px",
                  border: `2px solid ${colors.selection}`,
                  borderRadius: 2,
                  background: colors.canvas,
                  color: colors.text,
                  resize: 'none',
                  outline: 'none',
                  zIndex: 20,
                  padding: 0,
                  margin: 0,
                }}
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Status Bar ──────────────────────────────────── */}
      <div
        style={{
          height: 35,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderTop: `1px solid ${colors.border}`,
          background: colors.backgroundSecondary,
          fontSize: 13.75,
          color: colors.textMuted,
          flexShrink: 0,
        }}
      >
        <span>
          {tool === "place"
            ? `Placing: ${(mode === 'diagram' ? DIAGRAM_TEMPLATES : TEMPLATES)[placingTemplate]?.label || "?"} — click canvas to drop`
            : "Select mode — click objects to move them"}
        </span>
        <span>⌘S to share • ⌘D to duplicate • Del to delete</span>
      </div>

      {/* ─── Notification ────────────────────────────────── */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: 55,
            left: "50%",
            transform: "translateX(-50%)",
            background: colors.buttonBg,
            color: colors.text,
            padding: "10px 25px",
            borderRadius: 7.5,
            fontSize: 16.25,
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
                4. Use toolbar buttons for undo/redo, zoom<br/>
                5. Export → paste into your AI tool
              </p>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: colors.text }}>Text Editing:</strong><br/>
                <kbd style={kbdStyle}>T</kbd> Text tool - click to add text<br/>
                <strong>Double-click</strong> any text to edit<br/>
                <kbd style={kbdStyle}>Enter</kbd> Edit selected text<br/>
                <kbd style={kbdStyle}>Ctrl+Enter</kbd> Finish editing<br/>
                <kbd style={kbdStyle}>Esc</kbd> Cancel editing
              </p>
              <p style={{ margin: "0 0 12px" }}>
                <strong style={{ color: colors.text }}>Keyboard Shortcuts:</strong><br/>
                <kbd style={kbdStyle}>Del</kbd> Delete selected<br/>
                <kbd style={kbdStyle}>Esc</kbd> Deselect / close<br/>
                <kbd style={kbdStyle}>⌘D</kbd> Duplicate<br/>
                <kbd style={kbdStyle}>⌘S</kbd> Share URL<br/>
                <kbd style={kbdStyle}>Ctrl+Shift+C</kbd> Clear canvas<br/>
                <kbd style={kbdStyle}>Ctrl+Z</kbd> Undo<br/>
                <kbd style={kbdStyle}>Ctrl+Shift+Z</kbd> or <kbd style={kbdStyle}>Ctrl+Y</kbd> Redo
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