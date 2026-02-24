import { useState, useRef, useCallback, useMemo } from "react";
import { TEMPLATES, CATEGORIES } from "../lib/templates";
import { DIAGRAM_TEMPLATES, DIAGRAM_CATEGORIES } from "../lib/diagram-templates";

// ─── Constants ────────────────────────────────────────────────
const CELL_W = 12.5;
const CELL_H = 22.5;
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

export function Canvas({
  objects,
  setObjectsWithHistory,
  selectedId,
  setSelectedId,
  tool,
  setTool,
  placingTemplate,
  setPlacingTemplate,
  dragState,
  setDragState,
  cursorPos,
  setCursorPos,
  editingTextId,
  setEditingTextId,
  editingText,
  setEditingText,
  notify,
  zoom,
  theme,
  colors,
  mode,
  activeLayer,
  isMobile
}) {
  const canvasRef = useRef(null);

  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) || null,
    [objects, selectedId]
  );

  const buffer = useMemo(
    () => renderAllObjects(objects, COLS, ROWS),
    [objects]
  );

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
          const newObj = { id: uid(), type: placingTemplate, x: col, y: row, data, mode, layerId: activeLayer };
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
    [tool, placingTemplate, pixelToCell, hitTest, notify, mode, setObjectsWithHistory, activeLayer, setSelectedId, setTool, setPlacingTemplate, setDragState]
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
    [dragState, pixelToCell, setObjectsWithHistory, setCursorPos]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setDragState(null);
  }, [setDragState]);

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

  const canvasWidth = COLS * CELL_W;
  const canvasHeight = ROWS * CELL_H;

  return (
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
  );
}