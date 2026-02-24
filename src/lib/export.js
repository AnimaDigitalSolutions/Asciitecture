// Export utilities for converting designs to various formats

export function bufferToMarkdown(buffer, trimEmpty = true) {
  let lines = [...buffer];
  
  // Trim empty lines from top and bottom
  if (trimEmpty) {
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
    while (lines.length > 0 && lines[0].trim() === "") {
      lines.shift();
    }
  }
  
  // Find minimum indentation
  let minIndent = Infinity;
  lines.forEach((line) => {
    if (line.trim().length > 0) {
      const spaces = line.match(/^( *)/)[1].length;
      minIndent = Math.min(minIndent, spaces);
    }
  });
  
  if (minIndent === Infinity) minIndent = 0;
  
  // Remove common indentation and trim end
  lines = lines.map((line) => line.substring(minIndent).trimEnd());
  
  // Wrap in markdown code block
  return "```\n" + lines.join("\n") + "\n```";
}

export function exportMarkdown(objects, canvasCols, canvasRows) {
  const buffer = renderAllObjects(objects, canvasCols, canvasRows);
  return bufferToMarkdown(buffer);
}

export function exportPlainText(objects, canvasCols, canvasRows) {
  const buffer = renderAllObjects(objects, canvasCols, canvasRows);
  
  // Trim empty lines
  let lines = [...buffer];
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }
  
  return lines.join("\n");
}

export function exportHTML(objects, canvasCols, canvasRows) {
  const buffer = renderAllObjects(objects, canvasCols, canvasRows);
  const content = buffer.join("\n");
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASCII Wireframe</title>
  <style>
    body {
      font-family: monospace;
      background: #0f0f12;
      color: #e4e4e7;
      padding: 2rem;
      margin: 0;
    }
    pre {
      font-size: 17.5px;
      line-height: 1.2;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <pre>${content}</pre>
</body>
</html>`;
}

export function copyToClipboard(text, onSuccess, onError) {
  navigator.clipboard.writeText(text).then(
    () => onSuccess?.(),
    (err) => onError?.(err)
  );
}

// Helper function to render objects to buffer
function renderAllObjects(objects, cols, rows) {
  // Create empty buffer
  let buffer = Array.from({ length: rows }, () => " ".repeat(cols));
  
  // Stamp each object onto the buffer
  objects.forEach((obj) => {
    buffer = stampObject(buffer, obj);
  });
  
  return buffer;
}

// Stamp an object onto the buffer
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

// Export formats configuration
export const EXPORT_FORMATS = {
  markdown: {
    label: "Markdown",
    extension: "md",
    mime: "text/markdown",
    exporter: exportMarkdown
  },
  text: {
    label: "Plain Text",
    extension: "txt",
    mime: "text/plain",
    exporter: exportPlainText
  },
  html: {
    label: "HTML",
    extension: "html",
    mime: "text/html",
    exporter: exportHTML
  }
};

// Download file helper
export function downloadFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}