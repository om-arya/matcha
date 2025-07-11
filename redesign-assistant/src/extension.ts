import * as vscode from 'vscode';
import * as path from 'path';

import SidebarProvider from './SidebarProvider';

// To compile and run the VSCode extension:
// 1. 'cd' into the directory containing "package.json"
// 2. Run 'npm run compile' in terminal
// 3. Press F5 in "extension.ts"

// This function is called when the extension is activated, i.e.,
// the very first time the command is executed
function activate(context: vscode.ExtensionContext) {
	console.log('The extension "MATCHA Redesign Assistant" is now active!');

	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"redesignAssistantSidebar",
			sidebarProvider
		)
	);

	const analyzeDocument = async (doc: vscode.TextDocument) => {
		if (doc.languageId !== "python") {
			return;
		}

		const text = doc.getText();

		let mplIndex = text.indexOf("import matplotlib");
		if (mplIndex === -1) { mplIndex = text.indexOf("from matplotlib import"); }
		if (mplIndex === -1) { return; }

		const scanText = text.substring(mplIndex);
		const issues: string[] = [];

		// Descriptive Labels
		(["title", "xlabel", "ylabel"] as const).forEach(fn => {
			const m = scanText.match(new RegExp(`${fn}\\s*\\(\\s*['"]([^'"]*)['"]`));
			if (m) {
				const txt = m[1].trim().toLowerCase();
			if (!txt || ["x", "y", "series 1"].includes(txt)) {
				issues.push(`MISSING_${fn.toUpperCase()}`);
			}
			} else {
				issues.push(`MISSING_${fn.toUpperCase()}`);
			}
		});

		// Legend required when multiple series plotted
		const plotCount = (scanText.match(/plot\s*\(/g) || []).length;
		const scatterCount = (scanText.match(/scatter\s*\(/g) || []).length;
		if (plotCount + scatterCount > 1 && !scanText.includes("legend(")) {
			issues.push("MISSING_LEGEND");
		}
		
		// Minimum Font Size (>= 15)
		const fsMatches = scanText.match(/fontsize\s*=\s*(\d+)/g);
		if (fsMatches) {
			if (fsMatches.some(m => parseInt(m.match(/=(\d+)/)![1]) < 15)) {
				issues.push("FONTSIZE_TOO_SMALL");
			}
		}
		
		// Minimum Figure Size (>= (8 × 5))
		const figMatch = scanText.match(/figsize\s*=\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
		if (figMatch) {
			const w = parseFloat(figMatch[1]);
			const h = parseFloat(figMatch[2]);
			if (w < 8 || h < 5) {
				issues.push("FIGSIZE_TOO_SMALL");
			}
		}

		// High-contrast colors only
		const colorMatches = scanText.match(/color\s*=\s*['"]([^'"]+)['"]/g) || [];
		const safe = new Set(["#000000", "#0072B2", "#009E73", "#D55E00", "black", "blue", "green", "orange"]);
		let hasUnsafe = false;
		colorMatches.forEach(cm => {
			const col = cm.split("=")[1].trim().replace(/['"]/g, "").toLowerCase();
			if (!safe.has(col)) {
				hasUnsafe = true;
			}
		});
		if (hasUnsafe) {
			issues.push("INSUFFICIENT_COLOR_CONTRAST");
		}

		// No animations allowed
		if (scanText.includes("FuncAnimation") || scanText.includes("animation.")) {
			issues.push("ANIMATIONS");
		}

		// Inverted Y‑axis
		if (/\.\s*invert_yaxis\s*\(/.test(scanText)) {
			issues.push("INVERTED_Y_AXIS");
		}

		// Truncated Y‑axis (y‑axis not starting at 0)
		const ylimRe = /(?:set_)?ylim\s*\(\s*([\-]?\d+(?:\.\d+)?)\s*,\s*([\-]?\d+(?:\.\d+)?)/g;
		let mY;
		while ((mY = ylimRe.exec(scanText)) !== null) {
			const lower = parseFloat(mY[1]);
			if (!isNaN(lower) && Math.abs(lower) > 1e-6) {
				issues.push("TRUNCATED_Y_AXIS");
				break;
			}
		}

		// 3‑D effects
		if (/['"]\s*3d\s*['"]/.test(scanText) // projection='3d'
		    || /Axes3D/.test(scanText) // from mpl_toolkits.mplot3d import Axes3D
		    || /plot_surface\s*\(/.test(scanText) // ax.plot_surface(...)
		) {
			issues.push("3D_EFFECTS");
		}

		// Tampered aspect ratio (extreme figsize or explicit aspect)
		const figRe = /figsize\s*=\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/;
		const figM  = scanText.match(figRe);
		if (figM) {
			const w = parseFloat(figM[1])
			const h = parseFloat(figM[2]);
			if (w && h) {
				const ratio = w / h;
				if (ratio < 0.5 || ratio > 2.0) { // squished or stretched shapes
					issues.push("TAMPERED_ASPECT_RATIO");
				}
			}
		}
		if (/set_aspect\s*\(/.test(scanText) || /aspect\s*=/.test(scanText)) {
			issues.push("TAMPERED_ASPECT_RATIO");
		}

		// Dual Y‑axes
		if (/twin[xy]\s*\(/.test(scanText) || /secondary_y\s*=\s*True/.test(scanText)) {
			issues.push("DUAL_Y_AXES");
		}

		// Send issues to the sidebar WebView
		sidebarProvider.setIssues(issues, path.basename(doc.uri.fsPath));
	};

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => analyzeDocument(e.document)));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => {
		if (e) {
			analyzeDocument(e.document)
		}
	}));

	// Analyze the currently active document at activation time
	if (vscode.window.activeTextEditor) {
		analyzeDocument(vscode.window.activeTextEditor.document);
	}
}

// This function is called when the extension is deactivated
function deactivate() {
	console.log("The extension has been deactivated");
}

export {
	activate,
	deactivate
}