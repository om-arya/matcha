import * as vscode from 'vscode';

import SidebarProvider from './SidebarProvider';

// To compile and run the VSCode extension:
// 1. 'cd' into the directory containing "package.json"
// 2. Run 'npm run compile' in terminal
// 3. Press F5 in "extension.ts"

// This function is called when the extension is activated, i.e.,
// the very first time the command is executed
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
		if (mplIndex === -1) { mplIndex = text.indexOf("from matplotlib import"); }
		if (mplIndex === -1) { return; }

		const scanText = text.substring(mplIndex);
		const issues: string[] = [];

		if (!(scanText.includes("legend()"))) {
			issues.push("MISSING_LEGEND");
		}

		if (!(scanText.includes("ax.set(title"))) {
			issues.push("MISSING_TITLE");
		}

		// Send issues to the sidebar WebView
		sidebarProvider.setIssues(issues);
	};

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => analyzeDocument(e.document)));

	analyzeDocument(vscode.window.activeTextEditor!.document); // Analyze the currently active document at activation time
}

// This function is called when the extension is deactivated
function deactivate() {
	console.log("The extension has been deactivated");
}

export {
	activate,
	deactivate
}