import * as vscode from 'vscode';
import { rules } from "./accessibilityRules";
import SidebarProvider from './SidebarProvider';

// To compile and run the VSCode extension:
// 1. 'cd' into the directory containing "package.json"
// 2. Run 'npm run compile' in terminal
// 3. Press F5 in "extension.ts"

// This function is called when the extension is activated, i.e.,
// the very first time the comma5d is executed
function activate(context: vscode.ExtensionContext) {
	console.log('The extension "Redesign-Assistant" is now active!');

	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"redesignAssistantSidebar",
			sidebarProvider
		)
	);

const analyzeDocument = (doc: vscode.TextDocument) => {
  if (doc.languageId !== "python") {
    return;
  }

  const text = doc.getText();
  let mplIndex = text.indexOf("import matplotlib");
  if (mplIndex === -1) {
    mplIndex = text.indexOf("from matplotlib import");
  }
  if (mplIndex === -1) {
    return;
  }

  const scanText = text.substring(mplIndex);
  const issues = [];

  // 1. Minimum Figure Size (>=8 × 5)
  const figMatch = scanText.match(/figsize\s*=\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
  if (figMatch) {
    const w = parseFloat(figMatch[1]), h = parseFloat(figMatch[2]);
    if (w < 8 || h < 5) issues.push(rules.get("FIGSIZE_TOO_SMALL")!);
  } else {
    issues.push(rules.get("MISSING_FIGSIZE")!);
  }

  // 2. Minimum Font Size (>=15)
  const fsMatches = scanText.match(/fontsize\s*=\s*(\d+)/g);
  if (fsMatches) {
    if (fsMatches.some(m => parseInt(m.match(/=(\d+)/)![1]) < 15)) {
      issues.push(rules.get("FONTSIZE_TOO_SMALL")!);
    }
  } else {
    issues.push(rules.get("MISSING_FONT_SIZE")!);
  }

  // 3. Descriptive Labels
  (["xlabel", "ylabel", "title"] as const).forEach(fn => {
    const m = scanText.match(new RegExp(`${fn}\\s*\\(\\s*['"]([^'"]*)['"]`));
    if (m) {
      const txt = m[1].trim().toLowerCase();
      if (!txt || ["x", "y", "series 1"].includes(txt)) {
        issues.push(rules.get(`MISSING_${fn.toUpperCase()}`)!);
      }
    } else {
      issues.push(rules.get(`MISSING_${fn.toUpperCase()}`)!);
    }
  });

  // 4. Legend required when multiple series plotted
  const plotCount = (scanText.match(/plot\s*\(/g) || []).length;
  const scatterCount = (scanText.match(/scatter\s*\(/g) || []).length;
  if (plotCount + scatterCount > 1 && !scanText.includes("legend(")) {
    issues.push(rules.get("MISSING_LEGEND")!);
  }

  // 5. Clutter advisory (for scatter)
  if (scatterCount > 0) {
    issues.push(rules.get("CLUTTER_WARNING")!);
  }

  // 6. High-contrast colors only
  const colorMatches = scanText.match(/color\s*=\s*['"]([^'"]+)['"]/g) || [];
  const safe = new Set(["#000000", "#0072B2", "#009E73", "#D55E00", "black", "blue", "green", "orange"]);
  colorMatches.forEach(cm => {
    const col = cm.split("=")[1].trim().replace(/['"]/g, "").toLowerCase();
    if (!safe.has(col)) {
      issues.push(rules.get("LOW_CONTRAST_COLOR")!);
    }
  });

  // 7. No animations allowed
  if (scanText.includes("FuncAnimation") || scanText.includes("animation.")) {
    issues.push(rules.get("AVOID_ANIMATION")!);
  }

  // Send issues to the sidebar WebView
  sidebarProvider.setIssues(issues);
};
context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => analyzeDocument(e.document)));
}
// This function is called when the extension is deactivated
function deactivate() {
	console.log("The extension has been deactivated");
}

export {
	activate,
	deactivate
}