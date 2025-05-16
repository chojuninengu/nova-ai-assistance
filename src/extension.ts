// Import VSCode API
import * as vscode from 'vscode';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Import OpenAI (v4 SDK)
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Called when extension activates
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "nova-ai-assistance" is now active!');

	// Hello World command
	const helloDisposable = vscode.commands.registerCommand('nova-ai-assistance.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from nova-ai!');
	});
	context.subscriptions.push(helloDisposable);

	// AI Suggest Code command
	const suggestDisposable = vscode.commands.registerCommand('nova-ai-assistance.suggestCode', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Open a file first to use Nova AI!');
			return;
		}

		const document = editor.document;
		const selection = editor.selection;
		const cursorPosition = selection.active;
		const text = document.getText();

		const prompt = `
Here is my code:
${text}

Please suggest code improvements or additions at cursor line ${cursorPosition.line + 1}:
`;

		try {
			const response = await openai.chat.completions.create({
				model: 'gpt-4',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.2,
				max_tokens: 512,
			});

			const aiMessage = response.choices[0]?.message?.content ?? 'No suggestion';

			await editor.edit(editBuilder => {
				editBuilder.insert(cursorPosition, `\n// Nova AI Suggestion:\n${aiMessage}\n`);
			});

			vscode.window.showInformationMessage('Nova AI suggestion inserted!');
		} catch (err) {
			console.error('Nova AI error:', err);
			vscode.window.showErrorMessage('Nova AI error: ' + (err as Error).message);
		}
	});
	context.subscriptions.push(suggestDisposable);
}

// Called when extension deactivates
export function deactivate() {}
