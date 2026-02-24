// ASCII Component Templates - AI-friendly and human-readable
export const TEMPLATES = {
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

export const CATEGORIES = {
  basics: { label: "Basics", color: "#8b9dc3" },
  ui: { label: "UI Elements", color: "#dda15e" },
  layout: { label: "Layout", color: "#6b9080" },
  draw: { label: "Draw", color: "#b5838d" },
};