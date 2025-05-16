import * as vscode from 'vscode';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.ViewColumn.Beside;
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel.panel.reveal(column);
    } else {
      ChatPanel.currentPanel = new ChatPanel(extensionUri, column);
    }
  }

  private constructor(extensionUri: vscode.Uri, column: vscode.ViewColumn) {
    this.extensionUri = extensionUri;

    this.panel = vscode.window.createWebviewPanel(
      'novaChat',
      'Nova AI Chat',
      column,
      { enableScripts: true }
    );

    this.panel.webview.html = this.getHtmlForWebview();

    this.panel.webview.onDidReceiveMessage(
      async message => {
        if (message.command === 'ask') {
          const res = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: message.text }],
            temperature: 0.4
          });

          const reply = res.choices[0]?.message?.content ?? 'Nova AI had no response.';
          this.panel.webview.postMessage({ command: 'reply', text: reply });
        }
      },
      undefined,
      this.disposables
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;
    this
  };