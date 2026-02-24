export function LayersPanel({
  showLayers,
  setShowLayers,
  layers,
  activeLayer,
  setActiveLayer,
  editingLayerId,
  editingLayerName,
  setEditingLayerName,
  startRenamingLayer,
  finishRenamingLayer,
  cancelRenamingLayer,
  toggleLayerVisibility,
  deleteLayer,
  addLayer,
  selectedId,
  setSelectedId,
  objects,
  colors,
  isMobile,
  TABS_ENABLED,
  tabs,
  activeTab,
  simpleObjects,
  inspBtnStyle
}) {
  // Get objects for a specific layer
  const getLayerObjects = (layerId) => {
    let allObjects;
    if (TABS_ENABLED) {
      const currentTab = tabs?.find(tab => tab.id === activeTab) || tabs?.[0];
      allObjects = currentTab?.objects || [];
    } else {
      allObjects = simpleObjects;
    }
    return allObjects.filter(obj => (obj.layerId || 1) === layerId);
  };

  // Desktop Layers Panel
  if (!isMobile && showLayers) {
    return (
      <div
        style={{
          position: "absolute",
          top: 60, // Height of toolbar
          right: 20,
          width: 200,
          background: colors.backgroundSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: 7.5,
          zIndex: 20,
          maxHeight: "calc(100vh - 140px)",
          overflowY: "auto",
        }}
      >
        {/* Layers Header */}
        <div
          style={{
            padding: "10px 12.5px",
            borderBottom: `1px solid ${colors.border}`,
            background: colors.buttonBg,
            borderRadius: "7.5px 7.5px 0 0",
            fontSize: 13.75,
            fontWeight: 600,
            color: colors.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>LAYERS</span>
          <button
            onClick={() => setShowLayers(false)}
            style={{
              background: "none",
              border: "none",
              color: colors.textMuted,
              fontSize: 16.25,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
        
        {/* Layers Content */}
        <div style={{ padding: "7.5px" }}>
          {layers.map((layer) => {
            const layerObjects = getLayerObjects(layer.id);
            
            return (
              <div key={layer.id} style={{ marginBottom: 7.5 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6.25,
                    padding: "6.25px 7.5px",
                    background: activeLayer === layer.id ? colors.selection + "20" : "transparent",
                    borderRadius: 5,
                    border: activeLayer === layer.id ? `1px solid ${colors.selection}` : `1px solid transparent`,
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: layer.visible ? colors.text : colors.textMuted,
                      fontSize: 13.75,
                      cursor: "pointer",
                      padding: 0,
                      opacity: layer.visible ? 1 : 0.5,
                    }}
                    title={layer.visible ? "Hide layer" : "Show layer"}
                  >
                    {layer.visible ? "👁" : "🚫"}
                  </button>
                  
                  {editingLayerId === layer.id ? (
                    <input
                      type="text"
                      value={editingLayerName}
                      onChange={(e) => setEditingLayerName(e.target.value)}
                      onBlur={finishRenamingLayer}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") finishRenamingLayer();
                        if (e.key === "Escape") cancelRenamingLayer();
                      }}
                      style={{
                        flex: 1,
                        background: colors.inputBg,
                        border: `1px solid ${colors.selection}`,
                        borderRadius: 3.75,
                        padding: "2.5px 5px",
                        fontSize: 11.25,
                        color: colors.text,
                        outline: "none",
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRenamingLayer(layer.id, layer.name);
                      }}
                      style={{
                        flex: 1,
                        fontSize: 11.25,
                        color: layer.visible ? colors.text : colors.textMuted,
                        fontWeight: activeLayer === layer.id ? 600 : 400,
                      }}
                    >
                      {layer.name}
                    </span>
                  )}
                  
                  <span style={{ 
                    fontSize: 10, 
                    color: colors.textMuted, 
                    minWidth: 20, 
                    textAlign: "right" 
                  }}>
                    {layerObjects.length}
                  </span>
                  
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: colors.textMuted,
                        fontSize: 11.25,
                        cursor: "pointer",
                        padding: "0 2.5px",
                        opacity: 0.7,
                      }}
                      title="Delete layer"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {/* Layer Objects */}
                {layer.visible && layerObjects.length > 0 && (
                  <div style={{ paddingLeft: 25, marginTop: 3.75 }}>
                    {layerObjects.map((obj) => (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedId(obj.id)}
                        style={{
                          padding: "3.75px 7.5px",
                          fontSize: 10,
                          color: selectedId === obj.id ? colors.selection : colors.textMuted,
                          background: selectedId === obj.id ? colors.selection + "10" : "transparent",
                          borderRadius: 3.75,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span>└</span>
                        <span style={{ fontWeight: selectedId === obj.id ? 600 : 400 }}>
                          {obj.type}_{obj.id.split("_")[1]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Layer Controls */}
          <div style={{ display: "flex", gap: 5, marginTop: 7.5 }}>
            {layers.length < 3 && (
              <button
                onClick={addLayer}
                style={{
                  ...inspBtnStyle,
                  flex: 1,
                  background: colors.selection,
                  borderColor: colors.selection,
                  color: "#fff",
                  fontSize: 10,
                  padding: "5px",
                }}
              >
                + Add
              </button>
            )}
            {activeLayer && layers.length > 1 && (
              <button
                onClick={() => deleteLayer(activeLayer)}
                style={{
                  ...inspBtnStyle,
                  flex: 1,
                  background: "#ef4444",
                  borderColor: "#ef4444",
                  color: "#fff",
                  fontSize: 10,
                  padding: "5px",
                }}
              >
                🗑 Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layers Overlay
  if (isMobile && showLayers) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: colors.modalBg,
          border: `1px solid ${colors.border}`,
          borderRadius: "10px 10px 0 0",
          zIndex: 100,
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "15px 20px 10px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: colors.backgroundSecondary,
            borderRadius: "10px 10px 0 0",
          }}
        >
          <span style={{ fontSize: 16.25, fontWeight: 600, color: colors.text }}>Layers</span>
          <button
            onClick={() => setShowLayers(false)}
            style={{
              background: "none",
              border: "none",
              color: colors.textMuted,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: "15px 20px" }}>
          {layers.map((layer) => {
            const layerObjects = getLayerObjects(layer.id);
            
            return (
              <div key={layer.id} style={{ marginBottom: 12.5 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px",
                    background: activeLayer === layer.id ? colors.selection + "20" : colors.backgroundSecondary,
                    borderRadius: 7.5,
                    border: activeLayer === layer.id ? `2px solid ${colors.selection}` : `1px solid ${colors.border}`,
                  }}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: layer.visible ? colors.text : colors.textMuted,
                      fontSize: 18,
                      cursor: "pointer",
                      padding: 0,
                      minWidth: 25,
                    }}
                  >
                    {layer.visible ? "👁" : "🚫"}
                  </button>
                  
                  <span style={{
                    flex: 1,
                    fontSize: 15,
                    color: colors.text,
                    fontWeight: activeLayer === layer.id ? 600 : 400,
                  }}>
                    {layer.name}
                  </span>
                  
                  <span style={{ fontSize: 12.5, color: colors.textMuted }}>
                    {layerObjects.length} items
                  </span>
                  
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: 16.25,
                        cursor: "pointer",
                        padding: 0,
                        minWidth: 25,
                      }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {layers.length < 3 && (
            <button
              onClick={addLayer}
              style={{
                width: "100%",
                padding: "12.5px",
                background: colors.selection,
                border: "none",
                borderRadius: 7.5,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Layer
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}