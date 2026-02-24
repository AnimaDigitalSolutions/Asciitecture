// AI-friendly diagram templates for flowcharts, ERDs, etc.

export const aiDiagram = {
  // Basic flowchart
  flowchart: (steps = ["Start", "Process", "Decision", "End"]) => {
    const lines = [];
    let y = 0;
    
    steps.forEach((step, i) => {
      if (i > 0) {
        lines.push("         │");
        lines.push("         ▼");
        y += 2;
      }
      
      if (step.includes("?") || step.toLowerCase().includes("decision")) {
        // Diamond for decisions
        lines.push("       ╱   ╲");
        lines.push(`     ╱ ${step.substring(0, 7).padEnd(7)} ╲`);
        lines.push("     ╲       ╱");
        lines.push("       ╲   ╱");
      } else if (i === 0 || i === steps.length - 1) {
        // Rounded for start/end
        lines.push("    ╭─────────╮");
        lines.push(`    │ ${step.substring(0, 9).padEnd(9)} │`);
        lines.push("    ╰─────────╯");
      } else {
        // Rectangle for process
        lines.push("    ┌─────────┐");
        lines.push(`    │ ${step.substring(0, 9).padEnd(9)} │`);
        lines.push("    └─────────┘");
      }
      y += 3;
    });
    
    return lines;
  },
  
  // Entity Relationship Diagram
  erd: (entities) => {
    // entities = { User: ['id', 'name', 'email'], Post: ['id', 'title', 'user_id'] }
    const lines = [];
    let x = 0;
    
    Object.entries(entities).forEach(([name, fields], i) => {
      if (i > 0) {
        // Add relationship arrow
        const prevWidth = 15;
        lines[2] += "───1:N──";
        x += 8;
      }
      
      const width = Math.max(name.length + 4, ...fields.map(f => f.length + 4), 15);
      
      // Entity box
      lines[0] = (lines[0] || "") + "┌" + "─".repeat(width - 2) + "┐";
      lines[1] = (lines[1] || "") + "│ " + name.padEnd(width - 4) + " │";
      lines[2] = (lines[2] || "") + "├" + "─".repeat(width - 2) + "┤";
      
      fields.forEach((field, j) => {
        const lineIdx = 3 + j;
        lines[lineIdx] = (lines[lineIdx] || "") + "│ " + field.padEnd(width - 4) + " │";
      });
      
      const bottomIdx = 3 + fields.length;
      lines[bottomIdx] = (lines[bottomIdx] || "") + "└" + "─".repeat(width - 2) + "┘";
      
      x += width;
    });
    
    return lines.filter(line => line); // Remove empty lines
  },
  
  // Sequence diagram
  sequence: (actors, interactions) => {
    // actors = ['Client', 'Server', 'Database']
    // interactions = [{from: 0, to: 1, message: 'Request'}, ...]
    const lines = [];
    const spacing = 20;
    
    // Header with actors
    let header = "";
    actors.forEach((actor, i) => {
      header += actor.padEnd(spacing);
    });
    lines.push(header);
    
    // Lifelines
    let lifeline = "";
    actors.forEach(() => {
      lifeline += "│".padEnd(spacing);
    });
    lines.push(lifeline);
    
    // Interactions
    interactions.forEach(({from, to, message}) => {
      let line = "";
      const direction = from < to ? "──" + message + "──>" : "<──" + message + "──";
      
      for (let i = 0; i < actors.length; i++) {
        if (i === Math.min(from, to)) {
          line += "├" + direction;
          i = Math.max(from, to) - 1;
        } else {
          line += "│".padEnd(spacing);
        }
      }
      lines.push(line);
      lines.push(lifeline);
    });
    
    return lines;
  },
  
  // State machine
  stateMachine: (states, transitions) => {
    // states = ['Idle', 'Processing', 'Complete']
    // transitions = [{from: 0, to: 1, label: 'start'}]
    const lines = [];
    
    // Simple horizontal layout
    let stateLine = "";
    states.forEach((state, i) => {
      if (i > 0) stateLine += "───";
      stateLine += `[${state}]`;
    });
    lines.push(stateLine);
    
    // Add transition labels below
    transitions.forEach(({from, to, label}) => {
      const padding = states.slice(0, from).join("]───[").length + 1;
      lines.push(" ".repeat(padding) + label);
    });
    
    return lines;
  },
  
  // Tree/hierarchy diagram
  tree: (root, children) => {
    // root = 'Root'
    // children = { 'Root': ['Child1', 'Child2'], 'Child1': ['Grandchild1'] }
    const lines = [];
    
    function drawNode(node, prefix = "", isLast = true) {
      lines.push(prefix + (isLast ? "└── " : "├── ") + node);
      
      const kids = children[node] || [];
      kids.forEach((child, i) => {
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        drawNode(child, newPrefix, i === kids.length - 1);
      });
    }
    
    lines.push(root);
    (children[root] || []).forEach((child, i, arr) => {
      drawNode(child, "", i === arr.length - 1);
    });
    
    return lines;
  },
  
  // Network topology
  network: (nodes, connections) => {
    // Simple network diagram
    const lines = [];
    
    lines.push("     [Server]");
    lines.push("    ╱   │   ╲");
    lines.push("   ╱    │    ╲");
    lines.push("[PC1] [PC2] [PC3]");
    
    return lines;
  },
  
  // Quick diagram from description
  quickDiagram: (description) => {
    // Parse description and generate appropriate diagram
    const lower = description.toLowerCase();
    
    if (lower.includes("flow") || lower.includes("process")) {
      return aiDiagram.flowchart(["Start", "Process 1", "Decision?", "Process 2", "End"]);
    } else if (lower.includes("database") || lower.includes("entity")) {
      return aiDiagram.erd({
        User: ["id", "name", "email"],
        Post: ["id", "user_id", "title"]
      });
    } else if (lower.includes("sequence") || lower.includes("api")) {
      return aiDiagram.sequence(
        ["Client", "Server", "Database"],
        [
          {from: 0, to: 1, message: "Request"},
          {from: 1, to: 2, message: "Query"},
          {from: 2, to: 1, message: "Results"},
          {from: 1, to: 0, message: "Response"}
        ]
      );
    } else {
      // Default to simple flowchart
      return aiDiagram.flowchart(["Step 1", "Step 2", "Step 3"]);
    }
  }
};