import { methods, keywords } from "./constant";

export type Method = typeof methods[number];

export interface TokenValue extends TokenNode {
  type: "Text";
  token: string;
  row: number;
  col: number;
}

export interface IParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: string;
  tokenModifiers: string[];
}

export interface TokenNode {
  type: string;
  start: number;
  end: number;
}

export interface ProgramNode extends TokenNode {
  type: "Program";
  body: (
    | ServiceDeclarationNode
    | StructDeclarationNode
    | ImportDeclarationNode
    | EnumDeclarationNode
    | CommentsNode
  )[];
}

export interface CommentsNode extends TokenNode {
  type: "Comments";
  content: string;
  row: number;
  col: number;
  variant: "block" | "inline";
}

export interface StructDeclarationNode extends TokenNode {
  type: "StructDeclaration";
  identify: string;
  content: StructContentNode;
  body: (KeywordNode | IdentifyNode | StructContentNode | CommentsNode)[];
}

export interface FormatNode extends TokenNode {
  type: "Format";
  format: string;
  optional: boolean;
  repeated: boolean;
  body: (TokenValue | CommentsNode)[];
}

export interface KeywordNode extends TokenNode {
  type: "Keyword";
  token: TokenValue;
  identify: typeof keywords[number];
}

export interface IdentifyNode extends TokenNode {
  type: "Identify";
  token: string;
}

export interface VariableDeclarationNode extends TokenNode {
  type: "VariableDeclaration";
  format: string;
  repeated: boolean;
  identify: string;
  optional: boolean;
  body: (FormatNode | IdentifyNode | CommentsNode)[];
}

export interface StructContentNode extends TokenNode {
  type: "StructContent";
  body: (VariableDeclarationNode | CommentsNode)[];
}

export interface EnumOptionNode extends TokenNode {
  type: "EnumOption";
  identify: string;
  body: (IdentifyNode | CommentsNode)[];
}

export interface EnumContentNode extends TokenNode {
  type: "EnumContent";
  optionList: string[];
  body: (EnumOptionNode | CommentsNode)[];
}

export interface EnumDeclarationNode extends TokenNode {
  type: "EnumDeclaration";
  identify: string;
  content: EnumContentNode;
  body: (KeywordNode | IdentifyNode | EnumContentNode | CommentsNode)[];
}

export interface ServiceDeclarationNode extends TokenNode {
  type: "ServiceDeclaration";
  identify: string;
  content: ServiceContentNode;
  body: (KeywordNode | IdentifyNode | ServiceContentNode | CommentsNode)[];
}

export interface ServiceContentNode extends TokenNode {
  type: "ServiceContent";
  body: (CommentsNode | FunctionDeclarationNode)[];
}

export interface FunctionArgumentsNode extends TokenNode {
  type: "FunctionArguments";
  body: (VariableDeclarationNode | CommentsNode)[];
}

export interface FunctionDeclarationNode extends TokenNode {
  type: "FunctionDeclaration";
  returnType: FormatNode;
  arguments: FunctionArgumentsNode;
  method: Method;
  identify: string;
  body: (FormatNode | IdentifyNode | CommentsNode | FunctionArgumentsNode)[];
}

export interface ImportDeclarationNode extends TokenNode {
  type: "ImportDeclaration";
  formats: string[];
  path: string;
  body: (
    | ImportContentNode
    | CommentsNode
    | KeywordNode
    | ImportPathNode
    | TokenValue
  )[];
}

export interface ImportContentNode extends TokenNode {
  type: "ImportContentNode";
  formats: string[];
  body: (ImportFormatNode | CommentsNode)[];
}

export interface ImportPathNode extends TokenNode {
  type: "ImportPathNode";
  content: TokenValue;
  path: string;
}

export interface ImportFormatNode extends TokenNode {
  type: "ImportFormatNode";
  format: string;
}

export interface FormatMapValue {
  origin: "declaration" | "import" | "basic";
}
