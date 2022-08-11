const methods = ["Get", "Post", "Put", "Delete", "Patch"] as const;
type Method = typeof methods[number];
export interface CommentsTree {
  type: "comments";
  // 注释的位置 独立成行或者是与其他内容共用一行
  display: "block" | "inline";
  content: string;
}
export interface VariableTree {
  // 类型：变量
  type: "variable";
  // 变量名称
  name: string;
  // 变量的数据类型
  format: string;
  // 是否是数组类型
  repeated: boolean;
}
export interface StructTree {
  type: "struct";
  name: string;
  items: VariableTree[];
}
export interface FunctionTree {
  type: "function";
  name: string;
  method: Method;
  requestArguments: VariableTree[];
  response: VariableTree;
}
export interface ServiceTree {
  type: "service";
  name: string;
  items: FunctionTree[];
}
export type AST =
  | VariableTree
  | StructTree
  | FunctionTree
  | ServiceTree
  | CommentsTree;

enum Status {
  Init = 1,
  Parsing,
  Fulfilled,
}

// parser负责把文本编译成AST
const splitChar = [" ", "\n", "(", ")", "{", "}", ";", ","];

class Parser {
  constructor() {
    this.formatMap = new Map();
    this.formatMap.set("int32", {});
    this.formatMap.set("int64", {});
    this.formatMap.set("double", {});
    this.formatMap.set("string", {});
    this.formatMap.set("boolean", {});
    this.formatMap.set("void", {});
  }

  // 状态机的指针位置信息
  index: number = 0;
  row: number = 0;
  col: number = 0;

  content: string = "";

  tree: AST[] = [];

  status: Status = Status.Init;

  // 允许的类型声明
  formatMap: Map<string, Partial<AST>>;

  setContent(content: string) {
    this.content = content;
  }

  wComments(prefix: string, display: "block" | "inline"): CommentsTree {
    const row = prefix + this.readRow();
    return {
      type: "comments",
      display,
      content: prefix + row,
    };
  }

  wKeyword(word: string) {
    if (word === "struct") {
      const astNode = this.wStruct({});
      // console.log(astNode);
      return astNode;
    }
    if (word === "service") {
      const astNode = this.wService({});
      // console.log(astNode);
      return astNode;
    }
    if (word.indexOf("//") === 0) {
      const astNode = this.wComments(word, "block");
      return astNode;
    }
    if (!word.length) {
      // 已经到头了
      // console.log("文件解析完毕");
      this.status = Status.Fulfilled;
      return null;
    }
    throw new Error("解析到了未经定义的关键字：" + word);
  }

  wVariable(variableStart: string, stopChars: string[]): VariableTree {
    let format = variableStart;
    let repeated = false;
    let name = "";
    if (variableStart === "repeated") {
      repeated = true;
      format = this.readWord();
    }
    if (!this.formatMap.has(format)) {
      throw new Error("未经定义的数据类型：" + format);
    }
    name = this.readWord();
    const stopChar = this.readWord();
    if (stopChars.indexOf(stopChar) === -1) {
      throw new Error("变量定义后必须有终止符");
    }
    return {
      format,
      name,
      type: "variable",
      repeated,
    };
  }

  wRequestArguments(): VariableTree[] {
    const prefix = this.readWord();
    if (prefix !== "(") {
      throw new Error("请求参数必须放在括号'()'内");
    }
    const args: VariableTree[] = [];
    while (true) {
      const word = this.readWord();
      if (word === ")") {
        break;
      }
      const variable = this.wVariable(word, [",", ")"]);
      args.push(variable);
      if (this.content.charAt(this.index - 1) === ")") {
        break;
      }
    }
    const endChar = this.readWord();
    if (endChar !== ";") {
      throw new Error("函数的声明必须以符号;结尾");
    }
    return args;
  }

  wParseMethod(name: string): Method {
    for (let method of methods) {
      if (name.indexOf(method) === 0) {
        return method;
      }
    }
    throw new Error(`无法识别函数名${name}的method`);
  }

  wFunction(start: string): FunctionTree {
    let responseType = start;

    const response: VariableTree = {
      name: "",
      type: "variable",
      format: "",
      repeated: false,
    };
    if (start === "repeated") {
      response.repeated = true;
      responseType = this.readWord();
    }
    if (!this.formatMap.has(responseType)) {
      throw new Error("未经定义的数据类型：" + responseType);
    }
    response.format = responseType;

    const name = this.readWord();

    const method = this.wParseMethod(name);

    const requestArguments = this.wRequestArguments();
    return {
      type: "function",
      name,
      requestArguments,
      response,
      method,
    };
  }

  wIntend(node: Partial<StructTree | ServiceTree>) {
    const prefix = this.readWord();
    if (prefix !== "{") {
      throw new Error("结构体或服务的名称后面应该使用大括号进行内容声明");
    }
    node.items = [];
    while (this.status === Status.Parsing) {
      const word = this.readWord();
      if (word === "}") break;
      if (node.type === "struct") {
        const item = this.wVariable(word, [";"]);
        node.items.push(item);
      }
      if (node.type === "service") {
        const item = this.wFunction(word);
        node.items.push(item);
      }
    }
    return node;
  }

  wStruct(node: Partial<StructTree>) {
    node.type = "struct";
    const name = this.readWord();
    node.name = name;
    this.wIntend(node);
    // 完成Struct的定义后需要将定义好的Struct添加到允许的数据类型中
    this.formatMap.set(node.name, { ...node, name: undefined });
    return node as StructTree;
  }

  wService(node: Partial<ServiceTree>) {
    node.type = "service";
    const name = this.readWord();
    node.name = name;
    this.wIntend(node);
    return node as ServiceTree;
  }

  build() {
    this.status = Status.Parsing;
    while (this.index < this.content.length && this.status === Status.Parsing) {
      const word = this.readWord();
      const ast = this.wKeyword(word);
      if (ast) {
        this.tree.push(ast);
      }
    }
    return this.tree;
  }

  errorChecker() {
    if (!this.content) throw new Error("Content内容不存在");
    if (this.index > this.content.length) {
      throw new Error("parser指针已越界");
    }
  }

  skipSpace(): void {
    this.errorChecker();
    const char = this.content.charAt(this.index);
    if (char === " " || char === "\n") {
      this.index++;
      this.col++;
      if (char === "\n") {
        this.col = 0;
        this.row++;
      }
      return this.skipSpace();
    }
    if (this.index > this.content.length) {
      this.status = Status.Fulfilled;
    }
    return;
  }

  readWord(): string {
    this.skipSpace();
    const char = this.content.charAt(this.index);
    if (
      char === "{" ||
      char === "}" ||
      char === "(" ||
      char === ")" ||
      char === ";"
    ) {
      this.index++;
      return char;
    }

    let wordStash = "";
    while (
      splitChar.indexOf(this.content.charAt(this.index)) === -1 &&
      this.index < this.content.length
    ) {
      wordStash += this.content.charAt(this.index);
      this.index++;
    }
    return wordStash;
  }
  readRow(): string {
    let row = "";
    while (
      this.content.charAt(this.index) !== "\n" &&
      this.index < this.content.length
    ) {
      row += this.content.charAt(this.index);
      this.index++;
    }
    return row;
  }
}

export default Parser;
