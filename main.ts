import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {GoogleGenAI} from "@google/genai";


interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple', name: 'Open sample modal (simple)', callback: () => {
				new SampleModal(this.app).open();
			}
		});

		this.addCommand({
			id: 'open-LangMath-modal', name: 'Open LangMath modal', checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}


					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		this.addCommand({
			id: 'makeLangmath', name: 'Make LangMath', editorCallback: (editor: Editor, view: MarkdownView): void => {
				const selectedText: string = editor.getSelection();
				if (!selectedText) {
					new Notice('Please select some text to convert to LangMath.');
					return;
				}
				console.log(editor.getSelection());
				const Ai = new UseAi();
				const response = Ai.getAiResponse(selectedText);

				if (!response) {
					new Notice('Failed to get response from AI.');
					console.log(Response)
					return;
				} else {
					response.then((result) => {
						editor.replaceSelection(result ?? '');
					});
				}
			}

		})

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});


		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('API Key (Google GenAI)')
			.setDesc('Enter your Google GenAI API Key')
			.addText(text => text
				.setPlaceholder('API Key')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

export class UseAi {
	private ApiKey: string;
	private ai: GoogleGenAI = new GoogleGenAI({apiKey: this.ApiKey});

	public async getAiResponse(query: string): Promise<string | undefined> {
		const prompt: string = `
		Hello Gemini, you are a Math AI. 
		Write the following query in LaTeX Format. 
		Only Respond with by obsidian used Math syntax $$  mathstuff  $$ .
		Like this: 
		$$
		math
		$$
		Do not respond with any other text, just the math syntax.
		If the user asks you to write a paragraph, do not write it.
		If the user asks for a formula, for example mass = density * volume, provide that formula.
		Thank you.
		The query is: ${query}`;

		const response = await this.ai.models.generateContent({
			model: "gemini-2.0-flash", contents: prompt,
		});
		console.log(`The response from gemeni is:  ${response.text}`);
		return response.text?.toString();
	}
}

