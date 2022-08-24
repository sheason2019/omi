export const keywords = [
  "struct",
  "service",
  "import",
  "from",
  "enum",
] as const;

export const methods = ["Get", "Post", "Put", "Delete", "Patch"] as const;

// parser负责把文本编译成AST
export const signalChar = ["(", ")", "{", "}", ";", ",", "?"];

export const quoteChar = ["'", '"'];

export const spaceChar = [" ", "\n"];

export const splitChar = signalChar.concat(spaceChar).concat(quoteChar);
