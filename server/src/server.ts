import {
	createConnection,
	Diagnostic,
	InitializeParams,
	InitializeResult,
	Position,
	ProposedFeatures,
	Range,
	TextDocuments,
	TextDocumentSyncKind,
	DiagnosticSeverity,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

import * as path from "path";
import * as url from "url";
import * as child_process from "child_process";

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
		},
	};
	return result;
});

documents.onDidSave((e) => {
	validateTextDocument(e.document);
});

documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

// !TODO allow user to change
const CAMELOT_PATH = `camelot`;

interface ICamelotWarning {
	filename: string;
	line: [number, number];
	col: [number, number];
	source: string;
	fix: string;
	violation: string;
}

const camelot = (documentPath: string): ICamelotWarning[] => {
	try {
		const command = `${CAMELOT_PATH} -show json -f ${documentPath}`;
		const res = child_process.execSync(command);
		const output = res.toString();
		console.log({ output });
		const parsed = JSON.parse(output);
		return parsed;
	} catch (error) {
		return [];
	}
};

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const docpath = url.fileURLToPath(textDocument.uri);
	const warnings = camelot(docpath);
	const diagnostics: Diagnostic[] = warnings
		.filter(({ filename }) => path.basename(filename) == path.basename(textDocument.uri))
		.map(({ line, col, source, fix, violation }) => ({
			range: Range.create(
				Position.create(line[0] - 1, col[0]),
				Position.create(line[1] - 1, col[1])
			),
			message: `${source}\nWarning: ${violation}\nConsider: ${fix}`,
			source: "camelot",
			severity: DiagnosticSeverity.Warning,
		}));
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.listen(connection);
connection.listen();
