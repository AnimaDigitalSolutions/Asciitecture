// AI-friendly ASCII templates for easy generation
// These functions return raw ASCII art arrays that AI can use directly

export const ai = {
  // Basic UI Elements
  text: (content) => [content],
  
  button: (text = "Click me") => [
    `┌${'─'.repeat(text.length + 2)}┐`,
    `│ ${text} │`,
    `└${'─'.repeat(text.length + 2)}┘`
  ],
  
  input: (label, placeholder = "Enter text...", width = 30) => {
    const lines = [];
    if (label) lines.push(label + ":");
    lines.push(`┌${'─'.repeat(width - 2)}┐`);
    lines.push(`│ ${placeholder.padEnd(width - 4)} │`);
    lines.push(`└${'─'.repeat(width - 2)}┘`);
    return lines;
  },
  
  checkbox: (label = "Option", checked = false) => [
    `[${checked ? 'x' : ' '}] ${label}`
  ],
  
  radio: (label = "Option", selected = false) => [
    `(${selected ? '●' : ' '}) ${label}`
  ],
  
  // Layout Components
  card: (title = "Card", content = [], width = 40) => {
    const lines = [];
    lines.push(`╔${'═'.repeat(width - 2)}╗`);
    lines.push(`║ ${title.padEnd(width - 4)} ║`);
    lines.push(`╠${'═'.repeat(width - 2)}╣`);
    
    // Add content lines
    if (content.length === 0) {
      for (let i = 0; i < 3; i++) {
        lines.push(`║${' '.repeat(width - 2)}║`);
      }
    } else {
      content.forEach(line => {
        lines.push(`║ ${line.padEnd(width - 4)} ║`);
      });
    }
    
    lines.push(`╚${'═'.repeat(width - 2)}╝`);
    return lines;
  },
  
  form: (title = "Form", fields = ["Name", "Email"], width = 40) => {
    const lines = [];
    lines.push(`┌${'─'.repeat(width - 2)}┐`);
    lines.push(`│ ${title.padEnd(width - 4)} │`);
    lines.push(`├${'─'.repeat(width - 2)}┤`);
    
    fields.forEach(field => {
      lines.push(`│ ${field}:`.padEnd(width - 1) + '│');
      lines.push(`│ ┌${'─'.repeat(width - 6)}┐ │`);
      lines.push(`│ │${' '.repeat(width - 6)}│ │`);
      lines.push(`│ └${'─'.repeat(width - 6)}┘ │`);
      lines.push(`│${' '.repeat(width - 2)}│`);
    });
    
    lines.push(`│  ┌────────┐  ┌────────┐  │`);
    lines.push(`│  │ Submit │  │ Cancel │  │`);
    lines.push(`│  └────────┘  └────────┘  │`);
    lines.push(`└${'─'.repeat(width - 2)}┘`);
    return lines;
  },
  
  // Complex Layouts
  dashboard: (title = "Dashboard", sections = ["Stats", "Charts", "Activity"]) => {
    const lines = [];
    const width = 80;
    
    // Header
    lines.push(`┌${'─'.repeat(width - 2)}┐`);
    lines.push(`│ ${title.padEnd(width - 4)} │`);
    lines.push(`├${'─'.repeat(width - 2)}┤`);
    
    // Navigation
    lines.push(`│ ${sections.join(' | ').padEnd(width - 4)} │`);
    lines.push(`├${'─'.repeat(width - 2)}┤`);
    
    // Main content area
    for (let i = 0; i < 15; i++) {
      lines.push(`│${' '.repeat(width - 2)}│`);
    }
    
    lines.push(`└${'─'.repeat(width - 2)}┘`);
    return lines;
  },
  
  table: (headers = ["Name", "Status", "Action"], rows = 3, colWidth = 15) => {
    const lines = [];
    const totalWidth = headers.length * (colWidth + 1) + 1;
    
    // Top border
    lines.push('┌' + headers.map(() => '─'.repeat(colWidth)).join('┬') + '┐');
    
    // Headers
    lines.push('│' + headers.map(h => (' ' + h).padEnd(colWidth)).join('│') + '│');
    
    // Header separator
    lines.push('├' + headers.map(() => '─'.repeat(colWidth)).join('┼') + '┤');
    
    // Data rows
    for (let i = 0; i < rows; i++) {
      lines.push('│' + headers.map(() => ' '.repeat(colWidth)).join('│') + '│');
    }
    
    // Bottom border
    lines.push('└' + headers.map(() => '─'.repeat(colWidth)).join('┴') + '┘');
    
    return lines;
  },
  
  // Layout Helpers
  grid: (cols = 3, rows = 2, cellWidth = 20, cellHeight = 5) => {
    const lines = [];
    
    for (let r = 0; r < rows; r++) {
      // Top border of row
      if (r === 0) {
        lines.push('┌' + ('─'.repeat(cellWidth) + '┬').repeat(cols - 1) + '─'.repeat(cellWidth) + '┐');
      } else {
        lines.push('├' + ('─'.repeat(cellWidth) + '┼').repeat(cols - 1) + '─'.repeat(cellWidth) + '┤');
      }
      
      // Cell content
      for (let h = 0; h < cellHeight; h++) {
        lines.push('│' + (' '.repeat(cellWidth) + '│').repeat(cols));
      }
    }
    
    // Bottom border
    lines.push('└' + ('─'.repeat(cellWidth) + '┴').repeat(cols - 1) + '─'.repeat(cellWidth) + '┘');
    
    return lines;
  },
  
  // Navigation
  navbar: (brand = "LOGO", links = ["Home", "About", "Contact"], width = 80) => [
    `┌${'─'.repeat(width - 2)}┐`,
    `│ ${brand}${' '.repeat(width - brand.length - links.join('  ').length - 6)}${links.join('  ')} │`,
    `└${'─'.repeat(width - 2)}┘`
  ],
  
  sidebar: (items = ["Dashboard", "Profile", "Settings", "Logout"], width = 25) => {
    const lines = [];
    lines.push(`┌${'─'.repeat(width - 2)}┐`);
    lines.push(`│ ${'≡ Menu'.padEnd(width - 4)} │`);
    lines.push(`├${'─'.repeat(width - 2)}┤`);
    
    items.forEach(item => {
      lines.push(`│ ${item.padEnd(width - 4)} │`);
    });
    
    lines.push(`└${'─'.repeat(width - 2)}┘`);
    return lines;
  },
  
  // Special Elements
  modal: (title = "Confirm", message = "Are you sure?", width = 50) => [
    `╔${'═'.repeat(width - 2)}╗`,
    `║ ${title.padEnd(width - 8)}[X] ║`,
    `╠${'═'.repeat(width - 2)}╣`,
    `║${' '.repeat(width - 2)}║`,
    `║ ${message.padEnd(width - 4)} ║`,
    `║${' '.repeat(width - 2)}║`,
    `╠${'═'.repeat(width - 2)}╣`,
    `║${' '.repeat(Math.floor((width - 24)/2))}[ Cancel ]  [ OK ]${' '.repeat(Math.ceil((width - 24)/2))}║`,
    `╚${'═'.repeat(width - 2)}╝`
  ],
  
  progress: (label = "Loading", percent = 50, width = 40) => {
    const barWidth = width - label.length - 10;
    const filled = Math.round(barWidth * percent / 100);
    const empty = barWidth - filled;
    return [
      `${label}: [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%`
    ];
  },
  
  // Helper to combine multiple components
  combine: (...components) => {
    return components.flat();
  },
  
  // Helper to add spacing
  spacer: (lines = 1) => {
    return Array(lines).fill('');
  }
};

// Export function for AI to generate complete wireframes
export function generateWireframe(description) {
  // This is a placeholder that AI can use as a guide
  // In practice, AI would parse the description and use the ai functions above
  return `
// To generate a wireframe for: "${description}"
// Use the ai functions like:

import { ai } from 'asciitecture/ai-templates';

const wireframe = ai.combine(
  ai.navbar("MyApp", ["Home", "Features", "Pricing"]),
  ai.spacer(1),
  ai.grid(3, 2),
  ai.spacer(1),
  ai.button("Get Started")
);

console.log(wireframe.join('\\n'));
`;
}