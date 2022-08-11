export interface TokenValue extends TokenNode {
  type: "Text";
  token: string;
}

export interface TokenNode {
  type: string;
  start: number;
  end: number;
}

export interface ProgramNode extends TokenNode {
  type: "Program";
  body: TokenNode[];
}

export interface CommentsNode extends TokenNode {
  type: "Comments";
  content: string;
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
  repeated: boolean;
  body: (TokenValue | CommentsNode)[];
}

export interface KeywordNode extends TokenNode {
  type: "Keyword";
  token: string;
  format: "struct" | "service";
}

export interface IdentifyNode extends TokenNode {
  type: "Identify";
  token: string;
}

export interface VariableDeclarationNode extends TokenNode {
  type: "VariableDeclaration";
  format: string;
  identify: string;
  body: (FormatNode | IdentifyNode | CommentsNode)[];
}

export interface StructContentNode extends TokenNode {
  type: "StructContent";
  body: (VariableDeclarationNode | CommentsNode)[];
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
  identify: IdentifyNode;
  body: (FormatNode | IdentifyNode | CommentsNode | FunctionArgumentsNode)[];
}
