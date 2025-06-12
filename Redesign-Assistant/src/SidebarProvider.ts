import * as vscode from 'vscode';

class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _issues: string[] = [];

	constructor(private readonly _extensionUri: vscode.Uri) { }

	public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true
		};
		
		webviewView.webview.html = this.getHtmlForWebview(this._issues);
		
	}

	public setIssues(issues: string[]) {
		this._issues = issues;
		if (this._view) {
			this._view!.webview.html = this.getHtmlForWebview(this._issues);
		}
	}

	private getHtmlForWebview(issues: string[]): string {
		if (issues.length === 0) {
			return `<html><body><h3>No accessibility issues found 🎉</h3></body></html>`;
		}

		const issueList = issues.map(issue => `<li>${issue}</li>`).join("");

		return `
			<html>
			<body>
				<h3>Accessibility Issues</h3>
				<ul>${issueList}</ul>
			</body>
			</html>
		`;
	}
}

export default SidebarProvider;