import * as vscode from 'vscode';

import { rules } from "./rules";

class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _issues: string[] = [];
	private _filename: string = "";

	constructor(private readonly _extensionUri: vscode.Uri) { }

	public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true
		};
		
		webviewView.webview.html = this.getHtmlForWebview(this._issues, this._filename);
		
	}

	public setIssues(issues: string[], filename: string) {
		this._issues = issues;
		this._filename = filename;
		if (this._view) {
			this._view!.webview.html = this.getHtmlForWebview(this._issues, this._filename);
		}
	}

	private getHtmlForWebview(issues: string[], filename: string): string {
		if (!filename) {
			return `
				<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<style>
						body {
							font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
							padding: 16px;
							color: #cccccc;
							background-color: #1e1e1e;
						}
					</style>
				</head>
				<body>
					<p>No Matplotlib code detected.</p>
				</body>
				</html>`;
		}

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
					body {
						font-family: 'Segoe UI', sans-serif;
						padding: 12px;
						background-color: #1e1e1e;
						color: #cccccc;
					}
					h3 {
						color:rgb(66, 178, 247);
					}
					.issue {
						margin-bottom: 20px;
						padding: 12px;
						border-radius: 6px;
						background-color: #2c2c2c;
						box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
					}
					.issue h3 {
						margin: 0 0 8px 0;
						color:rgb(240, 163, 91);
					}
					.no-issues {
						color: #4caf50;
						font-size: 1.2em;
					}
				</style>
			</head>
			<body>
				<h3>Accessibility issues in <code>${filename}</code>:</h3>
				${issues.length === 0
					? `<p class="no-issues">No accessibility issues found! 🎉</p>`
					: issues.map(issue => {
						const rule = rules.get(issue)!;
						return `
							<div class="issue">
								<h3>${rule.title}</h3>
								<p>${rule.description}</p>
							</div>
						`;
					}).join("")}
			</body>
			</html>
		`;
	}
}

export default SidebarProvider;