import {
	CompletionItem,
	createConnection,
	Diagnostic,
	DiagnosticRelatedInformation,
	DidChangeConfigurationNotification,
	InitializeParams,
	InitializeResult,
	Position,
	ProposedFeatures,
	Range,
	TextDocumentPositionParams,
	TextDocuments,
	TextDocumentSyncKind,
	Location,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

import * as path from "path";
import * as child_process from "child_process";

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: { resolveProvider: true },
		},
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = { workspaceFolders: { supported: true } };
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders((_event) => {
			connection.console.log("Workspace folder change event received.");
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not
// supported by the client. Please note that this is not the case when using
// this server with the client provided in this example but could happen with
// other clients.
const defaultSettings: ExampleSettings = {
	maxNumberOfProblems: 100,
};
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration((change) => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}
	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

// Only keep settings for open documents
documents.onDidClose((e) => {
	documentSettings.delete(e.document.uri);
});

documents.onDidSave((e) => {
	validateTextDocument(e.document);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	connection.console.log("We received an file change event");
});

// !TODO allow user to change
const CAMELOT_PATH = `camelot`;

interface ICamelotWarning {
	filename: string;
	range: Range;
	warning: string;
}

const toRange = (lines: string, columns: string): Range => {
	let [lineStart, lineEnd = lineStart] = lines.split("-").map((n) => Number(n) - 1) as number[];
	let [colStart, colEnd = colStart] = columns.split("-").map((n) => Number(n)) as number[];
	return Range.create(Position.create(lineStart, colStart), Position.create(lineEnd, colEnd));
};

const camelot = (documentPath: string): ICamelotWarning[] => {
	const command = `${CAMELOT_PATH} -show ta -f ${documentPath}`;
	console.log(`Running ${command}`);
	const res = child_process.execSync(command);
	const output = res.toString();
	const parser = /File (.*), line[s]? ([0-9]+(?:-[0-9]+)?), columns: ([0-9]+(?:-[0-9]+)?)\nWarning:(.*)/g;
	const matches = Array.from(output.matchAll(parser));
	return matches.map((match) => ({
		filename: match[1],
		range: toRange(match[2], match[3]),
		warning: match[4],
	}));
};

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const warnings = camelot(textDocument.uri);
	const diagnostics: Diagnostic[] = warnings
		.filter(({ filename }) => path.basename(filename) == path.basename(textDocument.uri))
		.map(({ range, warning }) => ({
			range,
			message: warning,
			relatedInformation: [
				DiagnosticRelatedInformation.create(
					Location.create(textDocument.uri, range),
					"camelot"
				),
			],
			source: "camelot",
		}));
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	return [];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
