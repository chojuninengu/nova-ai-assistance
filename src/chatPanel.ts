import * as vscode from 'vscode';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize OpenAI
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
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private getHtmlForWebview(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Nova AI Chat</title>
        <style>
          body {
            font-family: sans-serif;
            margin: 0;
            padding: 1rem;
            background-color: #1e1e1e;
            color: white;
          }
          textarea {
            width: 100%;
            height: 100px;
            margin-bottom: 1rem;
            background: #2e2e2e;
            color: white;
            border: none;
            padding: 0.5rem;
            border-radius: 4px;
          }
          button {
            background-color: #007acc;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .reply {
            margin-top: 1rem;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <h2>Nova AI Chat</h2>
        <textarea id="prompt" placeholder="Ask Nova AI..."></textarea>
        <button onclick="send()">Send</button>
        <div id="response" class="reply"></div>

        <script>
          const vscode = acquireVsCodeApi();
          function send() {
            const text = document.getElementById('prompt').value;
            vscode.postMessage({ command: 'ask', text });
          }

          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'reply') {
              document.getElementById('response').textContent = message.text;
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}
