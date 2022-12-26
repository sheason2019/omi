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

export interface ITokenOut {
  TokenList: IToken[];
  ErrorBlocks: IErrorBlock[];
}