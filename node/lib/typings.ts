export interface IToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: string;
  tokenModifiers: null | string[];
  Content: string;
}

export interface IErrorBlock {
  FromRow: number;
  FromCol: number;
  ToRow: number;
  ToCol: number;

  Message: string;
  Token: IToken;
}

export interface ITokenOutput {
  TokenList: IToken[];
  ErrorBlocks: IErrorBlock[];
}

export interface IOutputContainer_Token {
  Type: "output/token";
  Payload: ITokenOutput;
}
export interface IOutputContainer_Error {
  Type: "output/error";
  Payload: {
    Message: string;
  };
}
export interface IOutputContainer_Code {
  Type: "output/code";
  Payload: {
    FilePaths: string[];
    Language: string;
  };
}
// 将三种可能的返回结果合并为一个复杂对象
export type IOutputContainer =
  | IOutputContainer_Token
  | IOutputContainer_Error
  | IOutputContainer_Code;
