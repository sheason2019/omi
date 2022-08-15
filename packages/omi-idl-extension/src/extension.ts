import * as vscode from "vscode";
import { OmiParser } from "omi-ast-parser";

// 代码高亮
interface IParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: string;
  tokenModifiers: string[];
}

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

let diagnosticCollection: vscode.DiagnosticCollection;
let ctx: vscode.ExtensionContext;

const legend = (function () {
  const tokenTypesLegend = [
    "comment",
    "string",
    "keyword",
    "operator",
    "type",
    "struct",
    "class",
    "interface",
    "format",
    "typeParameter",
    "formatProperty",
    "function",
    "variable",
    "parameter",
    "property",
    "label",
  ];
  tokenTypesLegend.forEach((tokenType, index) =>
    tokenTypes.set(tokenType, index)
  );

  const tokenModifiersLegend = [
    "declaration",
    "documentation",
    "readonly",
    "static",
    "abstract",
    "deprecated",
    "modification",
    "async",
  ];
  tokenModifiersLegend.forEach((tokenModifier, index) =>
    tokenModifiers.set(tokenModifier, index)
  );

  return new vscode.SemanticTokensLegend(
    tokenTypesLegend,
    tokenModifiersLegend
  );
})();

class DocumentSemanticTokensProvider
  implements vscode.DocumentSemanticTokensProvider
{
  // onDidChangeSemanticTokens?: vscode.Event<void> | undefined;
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens | null | undefined> {
    const allTokens = this._parseText(document.getText(), document.uri);

    const builder = new vscode.SemanticTokensBuilder();
    allTokens.forEach((token) => {
      builder.push(
        token.line,
        token.startCharacter,
        token.length,
        this._encodeTokenType(token.tokenType),
        this._encodeTokenModifiers(token.tokenModifiers)
      );
    });
    return builder.build();
  }

  private _encodeTokenType(tokenType: string): number {
    if (tokenTypes.has(tokenType)) {
      return tokenTypes.get(tokenType)!;
    } else if (tokenType === "notInLegend") {
      return tokenTypes.size + 2;
    }
    return 0;
  }

  private _encodeTokenModifiers(strTokenModifiers: string[]): number {
    let result = 0;
    for (let i = 0; i < strTokenModifiers.length; i++) {
      const tokenModifier = strTokenModifiers[i];
      if (tokenModifiers.has(tokenModifier)) {
        result = result | (1 << tokenModifiers.get(tokenModifier)!);
      } else if (tokenModifier === "notInLegend") {
        result = result | (1 << (tokenModifiers.size + 2));
      }
    }
    return result;
  }

  private _parseText(text: string, uri: vscode.Uri): IParsedToken[] {
    const parser = new OmiParser();
    parser.setContent(text);
    try {
      diagnosticCollection.clear();
      parser.build();
    } catch (e) {
      const err = e as Error;
      const position = parser.getPosition();
      const currentToken = parser.getCurrentToken();
      const range = new vscode.Range(
        position.row,
        position.col - currentToken.token.length,
        position.row,
        position.col
      );
      const diagnostic = new vscode.Diagnostic(range, err.message);
      diagnosticCollection.set(uri, [diagnostic]);
    }
    const tokens = parser.getAllToken();
    return tokens;
  }
}

// 插件入口
export function activate(context: vscode.ExtensionContext) {
  ctx = context;
  diagnosticCollection = vscode.languages.createDiagnosticCollection("omi");
  ctx.subscriptions.push(diagnosticCollection);
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: "omi" },
      new DocumentSemanticTokensProvider(),
      legend
    )
  );
}
