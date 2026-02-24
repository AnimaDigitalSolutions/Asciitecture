// ─── Diagram Templates for flowcharts, ERDs, etc. ────────────────────────────

export const DIAGRAM_TEMPLATES = {
  // Shapes
  box: {
    label: "Box",
    category: "shapes",
    icon: "□",
    create: (text = "Process", width = 20, height = 5) => {
      const lines = [];
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      const textPadded = text.substring(0, width - 4).padEnd(width - 4);
      const midLine = Math.floor(height / 2) - 1;
      for (let i = 0; i < height - 2; i++) {
        if (i === midLine) {
          lines.push("│ " + textPadded + " │");
        } else {
          lines.push("│" + " ".repeat(width - 2) + "│");
        }
      }
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: height };
    },
  },
  diamond: {
    label: "Diamond",
    category: "shapes",
    icon: "◇",
    create: (text = "Decision", width = 20) => {
      const lines = [];
      const half = Math.floor(width / 2);
      const textPadded = text.substring(0, width - 6);
      
      // Top half
      for (let i = 0; i < half - 1; i++) {
        const spaces = half - i - 1;
        const inner = i * 2;
        lines.push(" ".repeat(spaces) + "╱" + " ".repeat(inner) + "╲");
      }
      
      // Middle with text
      lines.push("╱ " + textPadded.padEnd(width - 4) + " ╲");
      
      // Bottom half
      for (let i = half - 2; i >= 0; i--) {
        const spaces = half - i - 1;
        const inner = i * 2;
        lines.push(" ".repeat(spaces) + "╲" + " ".repeat(inner) + "╱");
      }
      
      return { lines, w: width, h: lines.length };
    },
  },
  circle: {
    label: "Circle",
    category: "shapes",
    icon: "○",
    create: (text = "State", size = 9) => {
      const lines = [];
      const radius = Math.floor(size / 2);
      const textPadded = text.substring(0, size - 4);
      
      lines.push(" ".repeat(radius - 1) + "╭─╮");
      for (let i = 0; i < size - 4; i++) {
        lines.push(" ".repeat(radius - 2) + "│   │");
      }
      const midLine = Math.floor(lines.length / 2);
      if (midLine > 0 && midLine < lines.length) {
        const spaces = Math.floor((size - 4 - textPadded.length) / 2);
        lines[midLine] = " ".repeat(radius - 2) + "│" + " ".repeat(spaces) + textPadded + " ".repeat(size - 4 - spaces - textPadded.length) + "│";
      }
      lines.push(" ".repeat(radius - 1) + "╰─╯");
      
      return { lines, w: size, h: lines.length };
    },
  },
  process: {
    label: "Process",
    category: "shapes",
    icon: "▭",
    create: (text = "Process", width = 20, height = 3) => {
      const lines = [];
      const textPadded = text.substring(0, width - 4).padEnd(width - 4);
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      lines.push("│ " + textPadded + " │");
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: height };
    },
  },
  data: {
    label: "Data",
    category: "shapes",
    icon: "◈",
    create: (text = "Data", width = 20, height = 3) => {
      const lines = [];
      const textPadded = text.substring(0, width - 6).padEnd(width - 6);
      lines.push(" ╱" + "─".repeat(width - 4) + "╲ ");
      lines.push("│  " + textPadded + "  │");
      lines.push(" ╲" + "─".repeat(width - 4) + "╱ ");
      return { lines, w: width, h: height };
    },
  },
  cylinder: {
    label: "Database",
    category: "shapes",
    icon: "⬭",
    create: (text = "Database", width = 20, height = 6) => {
      const lines = [];
      const textPadded = text.substring(0, width - 4).padEnd(width - 4);
      
      lines.push(" ╭" + "─".repeat(width - 4) + "╮ ");
      lines.push("│ " + " ".repeat(width - 4) + " │");
      const midLine = Math.floor((height - 2) / 2);
      for (let i = 0; i < height - 4; i++) {
        if (i === midLine) {
          lines.push("│ " + textPadded + " │");
        } else {
          lines.push("│ " + " ".repeat(width - 4) + " │");
        }
      }
      lines.push("│ " + " ".repeat(width - 4) + " │");
      lines.push(" ╰" + "─".repeat(width - 4) + "╯ ");
      
      return { lines, w: width, h: height };
    },
  },
  
  // Connectors
  arrow_right: {
    label: "Arrow →",
    category: "connectors",
    icon: "→",
    create: (length = 10) => {
      return { lines: ["─".repeat(length - 2) + "→"], w: length, h: 1 };
    },
  },
  arrow_left: {
    label: "Arrow ←",
    category: "connectors",
    icon: "←",
    create: (length = 10) => {
      return { lines: ["←" + "─".repeat(length - 2)], w: length, h: 1 };
    },
  },
  arrow_both: {
    label: "Arrow ↔",
    category: "connectors",
    icon: "↔",
    create: (length = 10) => {
      return { lines: ["←" + "─".repeat(length - 4) + "→"], w: length, h: 1 };
    },
  },
  arrow_down: {
    label: "Arrow ↓",
    category: "connectors",
    icon: "↓",
    create: (height = 5) => {
      const lines = [];
      for (let i = 0; i < height - 1; i++) lines.push("│");
      lines.push("↓");
      return { lines, w: 1, h: height };
    },
  },
  arrow_up: {
    label: "Arrow ↑",
    category: "connectors",
    icon: "↑",
    create: (height = 5) => {
      const lines = [];
      lines.push("↑");
      for (let i = 0; i < height - 1; i++) lines.push("│");
      return { lines, w: 1, h: height };
    },
  },
  dashed_line: {
    label: "Dashed",
    category: "connectors",
    icon: "╌",
    create: (length = 10) => {
      return { lines: ["╌".repeat(length)], w: length, h: 1 };
    },
  },
  double_line: {
    label: "Double",
    category: "connectors",
    icon: "═",
    create: (length = 10) => {
      return { lines: ["═".repeat(length)], w: length, h: 1 };
    },
  },
  wavy_arrow: {
    label: "Wavy →",
    category: "connectors",
    icon: "↝",
    create: (length = 10) => {
      return { lines: ["∼".repeat(length - 2) + "→"], w: length, h: 1 };
    },
  },
  
  // Annotations
  label: {
    label: "Label",
    category: "annotations",
    icon: "T",
    create: (text = "Label") => {
      return { lines: [text], w: text.length, h: 1 };
    },
  },
  comment: {
    label: "Comment",
    category: "annotations",
    icon: "💭",
    create: (text = "Comment", width = 20) => {
      const lines = [];
      const textPadded = text.substring(0, width - 6).padEnd(width - 6);
      lines.push("╭─" + "─".repeat(width - 5) + "─╮");
      lines.push("│ " + textPadded + " │");
      lines.push("╰─" + "─".repeat(width - 7) + "◜─╯");
      lines.push("   ╰");
      return { lines, w: width, h: 4 };
    },
  },
  note: {
    label: "Note",
    category: "annotations",
    icon: "ⓘ",
    create: (text = "Note", width = 20) => {
      const lines = [];
      const textPadded = text.substring(0, width - 4).padEnd(width - 4);
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      lines.push("│ⓘ " + textPadded.substring(0, width - 5) + " │");
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: 3 };
    },
  },
  number: {
    label: "Number",
    category: "annotations",
    icon: "①",
    create: (num = "1") => {
      const nums = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
      const idx = parseInt(num) - 1;
      return { lines: [nums[idx] || `(${num})`], w: 1, h: 1 };
    },
  },
  
  // Containers
  dotted_box: {
    label: "Dotted Box",
    category: "containers",
    icon: "┆",
    create: (title = "Group", width = 30, height = 10) => {
      const lines = [];
      const titlePadded = title.substring(0, width - 6);
      lines.push("┌┈" + titlePadded + "┈".repeat(width - titlePadded.length - 3) + "┐");
      for (let i = 0; i < height - 2; i++) {
        lines.push("┆" + " ".repeat(width - 2) + "┆");
      }
      lines.push("└" + "┈".repeat(width - 2) + "┘");
      return { lines, w: width, h: height };
    },
  },
  swimlane: {
    label: "Swimlane",
    category: "containers",
    icon: "═",
    create: (labels = ["Lane 1", "Lane 2"], width = 60, height = 15) => {
      const lines = [];
      const laneWidth = Math.floor(width / labels.length);
      
      // Header
      lines.push("╔" + labels.map(() => "═".repeat(laneWidth - 1)).join("╦") + "╗");
      lines.push("║" + labels.map(l => (" " + l).padEnd(laneWidth - 1)).join("║") + "║");
      lines.push("╠" + labels.map(() => "═".repeat(laneWidth - 1)).join("╬") + "╣");
      
      // Content area
      for (let i = 0; i < height - 4; i++) {
        lines.push("║" + labels.map(() => " ".repeat(laneWidth - 1)).join("║") + "║");
      }
      
      lines.push("╚" + labels.map(() => "═".repeat(laneWidth - 1)).join("╩") + "╝");
      return { lines, w: width, h: height };
    },
  },
  cloud: {
    label: "Cloud",
    category: "containers",
    icon: "☁",
    create: (text = "Cloud", width = 20, height = 6) => {
      const lines = [];
      const textPadded = text.substring(0, width - 8).padEnd(width - 8);
      
      lines.push("    ╭─────╮");
      lines.push("  ╭─╯     ╰─╮");
      lines.push(" ╱ " + textPadded + " ╲");
      lines.push("╰─╮         ╭─╯");
      lines.push("  ╰─────────╯");
      
      return { lines, w: width, h: 5 };
    },
  },
  
  // Entity Relationship
  entity: {
    label: "Entity",
    category: "containers",
    icon: "▣",
    create: (name = "Entity", attrs = ["id", "name"], width = 20) => {
      const lines = [];
      const namePadded = name.substring(0, width - 4).padEnd(width - 4);
      
      lines.push("┌" + "─".repeat(width - 2) + "┐");
      lines.push("│ " + namePadded + " │");
      lines.push("├" + "─".repeat(width - 2) + "┤");
      
      attrs.forEach(attr => {
        lines.push("│ " + attr.substring(0, width - 4).padEnd(width - 4) + " │");
      });
      
      lines.push("└" + "─".repeat(width - 2) + "┘");
      return { lines, w: width, h: lines.length };
    },
  },
};

export const DIAGRAM_CATEGORIES = {
  shapes: { label: "Shapes", color: "#3b82f6" },
  connectors: { label: "Connectors", color: "#10b981" },
  annotations: { label: "Annotations", color: "#f59e0b" },
  containers: { label: "Containers", color: "#8b5cf6" },
};