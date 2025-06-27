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

		const res = await fetch('http://127.0.0.1:8000/get_gemini_api_key');
		const GEMINI_API_KEY = await res.json();

		const prompt = `Graphical Integrity: Graphs should follow conventional design norms that align with how people usually interpret visuals. When a graph strays from these norms, like flipping the y-axis so it starts at the top instead of the bottom, it messes with people’s expectations and can lead to false conclusions. These kinds of visual tricks break graphical integrity and distort the true message. Misleading Elements Inverted Axes Y-axes that go from top to bottom (instead of bottom to top) can make increases look like decreases, flipping the meaning of the data. Truncated Axes Cutting off the bottom of a y-axis makes small differences between bars or lines look way bigger than they are. 3D Effects Adding depth to charts (like in 3D pie charts) can skew proportions and make certain slices look larger just because of how they’re angled. Area as Quantity Using bubbles or shapes where size represents value often misleads because people aren’t great at judging area. This makes big values seem even bigger (or smaller ones disappear). Stretched or Squished Aspect Ratios Changing the shape of the graph (tall vs. wide) alters the slope and exaggerates trends that aren't really that steep. Dual Axes Graphs that use two different y-axes with different scales can create fake correlations between lines that don’t actually relate. Logarithmic Scales (Without Context) Log scales can make exponential growth look flat. Without clear labeling, people might think the trend is mild when it's actually exploding. Contextual Bias Outside of the visuals, context clues like annotations, titles, or extra text can mislead too. If a graph has a dramatic or slanted title (“COVID cases exploded after vaccines!”) or annotations that suggest a cause-effect relationship that isn’t backed by the data, people might interpret it wrong even if the chart itself is fine. Misleading Contextual Elements (Narrative Biases) Mentioned in (Exploring Educational Approaches to Addressing Misleading Visualizations) the top-down processing is how viewers use prior knowledge or external cues: Biased or Slanted Titles Steer viewers’ interpretation before they even analyze the data. Misleading Annotations Emphasize or fabricate causal relationships (e.g., law passed → drop in deaths). Deceptive Legends or Labels Omit key categories, reverse meanings, or use vague groupings. Framing in the Accompanying Text Selective wording outside the graph (e.g., on social media) adds persuasive bias. Assess this file based on the given guidelines: ${scanText}`;

		let response;
		try {
			const requestBody = {
				contents: [
					{
						parts: [
							{ text: prompt },
						],
					},
				],
			};

			const res = await fetch(
				`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(requestBody),
				}
			);

			response = await res.json();
		} catch (err) {
			console.error('Summarization failed:', err);
		}

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

		issues.push(response);

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