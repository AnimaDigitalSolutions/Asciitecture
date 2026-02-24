import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { TEMPLATES, CATEGORIES } from "./lib/templates";
import { DIAGRAM_TEMPLATES, DIAGRAM_CATEGORIES } from "./lib/diagram-templates";
import { Storage } from "./lib/storage";
import { exportMarkdown, copyToClipboard, downloadFile } from "./lib/export";
import { LayersPanel } from "./components/LayersPanel";
import { Canvas } from "./components/Canvas";
import { TemplateLibrary } from "./components/TemplateLibrary";
import { useExportImport } from "./hooks/useExportImport";


// ─── Feature Flags ────────────────────────────────────────────
const TABS_ENABLED = import.meta.env.VITE_FEATURE_TABS === 'true';

// ─── Unique ID Generator ──────────────────────────────────────
let _uid = 0;
const uid = () => `obj_${++_uid}_${Date.now()}`;

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
  
  // Layers state
  const [layers, setLayers] = useState([
    { id: 1, name: 'Layer 1', visible: true, objects: [] },
    { id: 2, name: 'Layer 2', visible: true, objects: [] },
    { id: 3, name: 'Layer 3', visible: true, objects: [] }
  ]);
  const [activeLayer, setActiveLayer] = useState(1);
  const [showLayers, setShowLayers] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  
  // Simple objects state (used when tabs are disabled)
  const [simpleObjects, setSimpleObjects] = useState([]);
  
  const canvasRef = useRef(null);
  
  // Get objects based on whether tabs are enabled, filtered by visible layers
  const objects = useMemo(() => {
    let allObjects;
    if (TABS_ENABLED) {
      const currentTab = tabs?.find(tab => tab.id === activeTab) || tabs?.[0];
      allObjects = currentTab?.objects || [];
    } else {
      allObjects = simpleObjects;
    }
    
    // Filter by visible layers
    const visibleLayers = layers.filter(layer => layer.visible).map(layer => layer.id);
    return allObjects.filter(obj => visibleLayers.includes(obj.layerId || 1));
  }, [tabs, activeTab, simpleObjects, layers]);
  
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

  // Use export/import hook
  const {
    showMarkdown, setShowMarkdown, markdownText,
    showImport, setShowImport, importText, setImportText,
    handleExportMarkdown, copyMarkdown, handleImport
  } = useExportImport(objects, setObjectsWithHistory, notify, activeLayer);

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
  
  // ─── Layer management ─────────────────────────────────────
  const addLayer = useCallback(() => {
    if (layers.length >= 3) {
      notify("Maximum 3 layers supported");
      return;
    }
    const newId = Math.max(...layers.map(l => l.id)) + 1;
    setLayers(prev => [...prev, { id: newId, name: `Layer ${newId}`, visible: true, objects: [] }]);
    setActiveLayer(newId);
    notify("Layer added");
  }, [layers, notify]);
  
  const deleteLayer = useCallback((layerId) => {
    if (layers.length === 1) {
      notify("Cannot delete the last layer");
      return;
    }
    
    // Move all objects from deleted layer to Layer 1
    const getAllObjects = () => {
      if (TABS_ENABLED) {
        const currentTab = tabs?.find(tab => tab.id === activeTab) || tabs?.[0];
        return currentTab?.objects || [];
      }
      return simpleObjects;
    };
    
    const allObjects = getAllObjects();
    const updatedObjects = allObjects.map(obj => 
      obj.layerId === layerId ? { ...obj, layerId: 1 } : obj
    );
    
    if (TABS_ENABLED) {
      setTabs(prevTabs => prevTabs.map(tab => 
        tab.id === activeTab 
          ? { ...tab, objects: updatedObjects }
          : tab
      ));
    } else {
      setSimpleObjects(updatedObjects);
    }
    
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (activeLayer === layerId) {
      setActiveLayer(layers.find(l => l.id !== layerId)?.id || 1);
    }
    notify("Layer deleted");
  }, [layers, activeLayer, tabs, activeTab, simpleObjects, notify]);
  
  const toggleLayerVisibility = useCallback((layerId) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  }, []);
  
  const startRenamingLayer = useCallback((layerId, currentName) => {
    setEditingLayerId(layerId);
    setEditingLayerName(currentName);
  }, []);
  
  const finishRenamingLayer = useCallback(() => {
    if (editingLayerId !== null && editingLayerName.trim()) {
      setLayers(prev => prev.map(layer => 
        layer.id === editingLayerId 
          ? { ...layer, name: editingLayerName.trim() }
          : layer
      ));
    }
    setEditingLayerId(null);
    setEditingLayerName('');
  }, [editingLayerId, editingLayerName]);
  
  const cancelRenamingLayer = useCallback(() => {
    setEditingLayerId(null);
    setEditingLayerName('');
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
            const dup = { ...obj, id: uid(), x: obj.x + 2, y: obj.y + 2, data: { ...obj.data, lines: [...obj.data.lines] }, layerId: activeLayer };
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
    const newObj = { id: uid(), type: "text", x: col, y: row, data, layerId: activeLayer };
    setObjectsWithHistory(prev => [...prev, newObj]);
    setSelectedId(newObj.id);
    // Start editing immediately
    setTimeout(() => startEditingText(newObj.id), 100);
    setTool("select");
    notify("Text added");
  }, [startEditingText, notify, activeLayer]);


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
        <TemplateLibrary
          mode={mode}
          setMode={setMode}
          placingTemplate={placingTemplate}
          startPlace={startPlace}
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          isMobile={isMobile}
          theme={theme}
          colors={colors}
          topBtnStyle={topBtnStyle}
          handleClearCanvas={handleClearCanvas}
          setShowHelp={setShowHelp}
          setShowImport={setShowImport}
          objects={objects}
          toggleTheme={toggleTheme}
        />

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
          {/* Layers Panel */}
          <LayersPanel
            showLayers={showLayers}
            setShowLayers={setShowLayers}
            layers={layers}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            editingLayerId={editingLayerId}
            editingLayerName={editingLayerName}
            setEditingLayerName={setEditingLayerName}
            startRenamingLayer={startRenamingLayer}
            finishRenamingLayer={finishRenamingLayer}
            cancelRenamingLayer={cancelRenamingLayer}
            toggleLayerVisibility={toggleLayerVisibility}
            deleteLayer={deleteLayer}
            addLayer={addLayer}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            objects={objects}
            colors={colors}
            isMobile={isMobile}
            TABS_ENABLED={TABS_ENABLED}
            tabs={tabs}
            activeTab={activeTab}
            simpleObjects={simpleObjects}
            inspBtnStyle={inspBtnStyle}
          />
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
              onClick={() => setShowLayers(!showLayers)}
              style={{
                ...toolBtnStyle,
                background: showLayers ? colors.selection : colors.buttonBg,
                color: showLayers ? "#fff" : colors.textMuted,
                padding: isMobile ? "3px 6px" : "4px 10px",
                fontSize: isMobile ? 10 : 12,
              }}
              title="Toggle layers panel"
            >
              {isMobile ? "L" : "🗂 Layers"}
            </button>
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
          <Canvas
            objects={objects}
            setObjectsWithHistory={setObjectsWithHistory}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            tool={tool}
            setTool={setTool}
            placingTemplate={placingTemplate}
            setPlacingTemplate={setPlacingTemplate}
            dragState={dragState}
            setDragState={setDragState}
            cursorPos={cursorPos}
            setCursorPos={setCursorPos}
            editingTextId={editingTextId}
            setEditingTextId={setEditingTextId}
            editingText={editingText}
            setEditingText={setEditingText}
            notify={notify}
            zoom={zoom}
            theme={theme}
            colors={colors}
            mode={mode}
            activeLayer={activeLayer}
            isMobile={isMobile}
          />
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