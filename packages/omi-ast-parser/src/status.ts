// 构建wFunction语法树的状态
export enum FunctionStatus {
  ReturnType = 1,
  Identify,
  Args,
  EndToken,
  Finish,
}

// 构建wService语法树的状态
export enum ServiceStatus {
  Keyword = 1,
  Identify,
  Content,
  Finish,
}

export enum EnumStatus {
  Keyword = 1,
  Identify,
  Content,
  Finish,
}

export enum EnumOption {
  Identify = 1,
  EndToken,
  Finish,
}

// 构建wFormat语法树的状态
export enum FormatStatus {
  Properties = 1,
  Format,
  Finish,
}

export enum VariableStatus {
  Format = 1,
  Identify,
  EndToken,
  Finish,
}

export enum ProgramStatus {
  Import = 1,
  Declare,
}

export enum ImportStatus {
  KeywordImport = 1,
  Content,
  KeywordFrom,
  Path,
  EndToken,
  Finish,
}
