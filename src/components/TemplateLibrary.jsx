import { useMemo } from "react";
import { TEMPLATES, CATEGORIES } from "../lib/templates";
import { DIAGRAM_TEMPLATES, DIAGRAM_CATEGORIES } from "../lib/diagram-templates";

export function TemplateLibrary({
  mode,
  setMode,
  placingTemplate,
  startPlace,
  showMobileMenu,
  setShowMobileMenu,
  isMobile,
  theme,
  colors,
  topBtnStyle,
  handleClearCanvas,
  setShowHelp,
  setShowImport,
  objects,
  toggleTheme
}) {
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

  return (
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
  );
}