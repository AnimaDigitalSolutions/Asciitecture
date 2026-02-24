// Storage management for auto-save and URL sharing

// Simple compression for URL sharing
const compress = (str) => {
  return btoa(encodeURIComponent(str));
};

const decompress = (str) => {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return null;
  }
};

export const Storage = {
  // Auto-save to localStorage
  save: (state) => {
    try {
      localStorage.setItem('asciitecture_autosave', JSON.stringify(state));
      localStorage.setItem('asciitecture_timestamp', Date.now().toString());
      return true;
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
      return false;
    }
  },
  
  // Load last session
  load: () => {
    try {
      const saved = localStorage.getItem('asciitecture_autosave');
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },
  
  // Get last save time
  getLastSaveTime: () => {
    const timestamp = localStorage.getItem('asciitecture_timestamp');
    return timestamp ? new Date(parseInt(timestamp)) : null;
  },
  
  // Clear saved data
  clear: () => {
    localStorage.removeItem('asciitecture_autosave');
    localStorage.removeItem('asciitecture_timestamp');
  },
  
  // Save a named design
  saveDesign: (name, state) => {
    try {
      const designs = JSON.parse(localStorage.getItem('asciitecture_designs') || '{}');
      designs[name] = {
        ...state,
        savedAt: Date.now()
      };
      localStorage.setItem('asciitecture_designs', JSON.stringify(designs));
      return true;
    } catch {
      return false;
    }
  },
  
  // Get all saved designs
  getSavedDesigns: () => {
    try {
      return JSON.parse(localStorage.getItem('asciitecture_designs') || '{}');
    } catch {
      return {};
    }
  },
  
  // Delete a saved design
  deleteDesign: (name) => {
    try {
      const designs = JSON.parse(localStorage.getItem('asciitecture_designs') || '{}');
      delete designs[name];
      localStorage.setItem('asciitecture_designs', JSON.stringify(designs));
      return true;
    } catch {
      return false;
    }
  },
  
  // URL State sharing
  shareViaURL: (objects) => {
    const minified = {
      o: objects.map(obj => ({
        t: obj.type,
        x: obj.x,
        y: obj.y,
        d: obj.data
      }))
    };
    const compressed = compress(JSON.stringify(minified));
    window.location.hash = compressed;
    return window.location.href;
  },
  
  loadFromURL: () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    
    try {
      const decompressed = decompress(hash);
      if (!decompressed) return null;
      
      const minified = JSON.parse(decompressed);
      if (!minified.o || !Array.isArray(minified.o)) return null;
      
      // Restore full object structure
      return {
        objects: minified.o.map((obj, index) => ({
          id: `imported_${Date.now()}_${index}`,
          type: obj.t,
          x: obj.x,
          y: obj.y,
          data: obj.d
        }))
      };
    } catch (e) {
      console.warn('Failed to load from URL:', e);
      return null;
    }
  },
  
  // Export/Import as JSON
  exportJSON: (state) => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `asciitecture_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  },
  
  importJSON: async () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      
      input.click();
    });
  }
};

// Auto-save debounce helper
export function useAutoSave(state, delay = 1000) {
  let timeoutId = null;
  
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      Storage.save(state);
    }, delay);
  };
}