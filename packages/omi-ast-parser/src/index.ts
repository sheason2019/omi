import {
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  IdentifyNode,
  KeywordNode,
  ProgramNode,
  ServiceContentNode,
  ServiceDeclarationNode,
  StructContentNode,
  StructDeclarationNode,
  TokenValue,
  VariableDeclarationNode,
} from "./typings";

// parser负责把文本编译成AST
const signalChar = ["(", ")", "{", "}", ";", ","];
const spaceChar = [" ", "\n"];
const splitChar = signalChar.concat(spaceChar);

export class OmiParser {
  // 用来解析的内容
  private content: string = "";

  private currentToken: TokenValue = {
    token: "",
    start: 0,
    end: 0,
  };

  setContent(value: string) {
    this.content = value;
    this.index = 0;
  }
  getContent() {
    return this.content;
  }

  // 状态机指针的位置信息
  private index: number = 0;

  wIdentify() {
    const token = this.currentToken;
    const identify: IdentifyNode = {
      type: "Identify",
      token: token.token,
      start: token.start,
      end: token.end,
    };
    return identify;
  }

  wFormat() {
    const body: FormatNode["body"] = [];
    let token = this.currentToken;
    const start = token.start;
    body.push(token);

    let repeated = false;
    if (token.token === "repeated") {
      repeated = true;
      token = this.readToken();
      body.push(token);
    }
    const format: FormatNode = {
      type: "Format",
      identify: token.token,
      format: token.token,
      start,
      end: token.end,
      repeated,
      body,
    };
    return format;
  }

  wVariable(splitChar: ("," | ";" | ")" | "}")[]) {
    const body: (FormatNode | IdentifyNode)[] = [];
    const format = this.wFormat();
    body.push(format);

    this.readToken();
    const identify = this.wIdentify();
    body.push(identify);

    const end = this.readToken();
    if ((<string[]>splitChar).indexOf(end.token) === -1) {
      throw new Error("变量声明没有应用正确的终止符：" + JSON.stringify(end));
    }

    const variable: VariableDeclarationNode = {
      type: "VariableDeclaration",
      start: format.start,
      end: end.end,
      format: format.identify,
      identify: identify.token,
      body: body,
    };
    return variable;
  }

  wFunctionArguments(): FunctionArgumentsNode {
    let token = this.currentToken;
    const start = token.start;
    if (token.token !== "(") {
      throw new Error("函数参数声明必须被包裹在小括号内");
    }

    const body: VariableDeclarationNode[] = [];
    token = this.readToken();

    do {
      if (this.currentToken.token === ")") {
        break;
      }
      body.push(this.wVariable([",", ")"]));
      if (this.currentToken.token === ")") {
        break;
      }
      token = this.readToken();
    } while (true);
    const end = this.currentToken.end;
    return {
      type: "FunctionArguments",
      body,
      start,
      end,
    };
  }

  wFunction(): FunctionDeclarationNode {
    const body: (IdentifyNode | FormatNode | FunctionArgumentsNode)[] = [];

    const returnType = this.wFormat();
    body.push(returnType);

    this.readToken();
    const identify = this.wIdentify();
    body.push(identify);

    this.readToken();
    const args = this.wFunctionArguments();
    body.push(args);

    const end = this.readToken();
    if (end.token !== ";") {
      throw new Error("函数定义必须以分号作为结尾");
    }

    const func: FunctionDeclarationNode = {
      type: "FunctionDeclaration",
      start: returnType.start,
      end: end.end,
      returnType,
      identify,
      arguments: args,
      body,
    };

    return func;
  }

  wServiceContent() {
    const token = this.currentToken;
    if (token.token !== "{") {
      throw new Error("Service的声明内容必须被包裹在 {} 里");
    }
    const body: ServiceContentNode["body"] = [];

    this.readToken();
    while (true) {
      const func = this.wFunction();
      body.push(func);
      const nextToken = this.readToken();
      if (nextToken.token === "}") {
        break;
      }
    }

    const content: ServiceContentNode = {
      type: "ServiceContent",
      start: token.start,
      end: this.currentToken.end,
      body,
    };

    return content;
  }

  wStructContent() {
    const token = this.currentToken;
    if (token.token !== "{") {
      throw new Error("Struct的声明内容必须被包裹在 {} 里");
    }
    const body: StructContentNode["body"] = [];

    this.readToken();
    while (true) {
      const variable = this.wVariable([";", "}"]);
      body.push(variable);
      const nextToken = this.readToken();
      if (nextToken.token === "}") {
        break;
      }
    }

    const content: StructContentNode = {
      type: "StructContent",
      start: token.start,
      body,
      end: this.currentToken.end,
    };
    return content;
  }

  wKeyword() {
    const token = this.currentToken;
    let format: "service" | "struct" = "service";
    if (token.token === "service") {
      format = "service";
    } else if (token.token === "struct") {
      format = "struct";
    } else {
      throw new Error("未知的关键字类型");
    }

    const keyword: KeywordNode = {
      type: "Keyword",
      token: token.token,
      format,
      start: token.start,
      end: token.end,
    };
    return keyword;
  }

  // 构建Service语法树
  wService() {
    const body: ServiceDeclarationNode["body"] = [];

    const start = this.currentToken.start;

    // 将声明关键词写入body
    const keyword = this.wKeyword();
    body.push(keyword);

    // 写入service的名称
    this.readToken();
    const identify = this.wIdentify();
    body.push(identify);

    // 写入service的内容
    this.readToken();
    const content = this.wServiceContent();
    body.push(content);

    const service: ServiceDeclarationNode = {
      type: "ServiceDeclaration",
      body,
      start: start,
      end: content.end,
      identify: identify.token,
      content,
    };

    return service;
  }
  // 构建Struct语法树
  wStruct() {
    const body: StructDeclarationNode["body"] = [];

    const start = this.currentToken.start;

    const keyword = this.wKeyword();
    body.push(keyword);

    this.readToken();
    const identify = this.wIdentify();
    body.push(identify);

    this.readToken();
    const content = this.wStructContent();
    body.push(content);

    const struct: StructDeclarationNode = {
      type: "StructDeclaration",
      body,
      start,
      end: this.currentToken.end,
      identify: identify.token,
      content,
    };

    return struct;
  }

  // 状态机初始化运转状态，可接收的token类型有：注释、结构体声明、服务声明
  wToken() {
    const token = this.readToken();
    let val: StructDeclarationNode | ServiceDeclarationNode | undefined;
    if (token.token === "service") {
      val = this.wService();
    } else if (token.token === "struct") {
      val = this.wStruct();
    }
    if (!val) {
      throw new Error("获取到了未定义的关键字");
    }
    return val;
  }

  private _build() {
    const body: ProgramNode["body"] = [];
    while (this.index < this.content.length) {
      body.push(this.wToken());
    }
    const program: ProgramNode = {
      type: "Program",
      body,
      start: 0,
      end: this.currentToken.end,
    };
    return program;
  }

  private errorHandler(func: () => any) {
    try {
      return func();
    } catch (e) {
      let row = 0;
      let col = 0;
      for (let i = 0; i < this.index; i++) {
        col++;
        if (this.content.charAt(i) === "\n") {
          col = 0;
          row++;
        }
      }
      console.log(
        `错误位置：第${row}行 第${col} 列 token: ${this.currentToken.token}`
      );
      console.error(e);
    }
  }

  // 构建抽象语法树
  build() {
    return this.errorHandler(() => this._build());
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
      return this.skipSpace();
    }
    return;
  }

  readToken(): TokenValue {
    this.skipSpace();
    const start = this.index;
    const char = this.content.charAt(this.index);
    if (signalChar.indexOf(char) !== -1) {
      this.index++;
      this.currentToken = { token: char, start, end: start + char.length };
      return this.currentToken;
    }

    let wordStash = "";
    while (
      splitChar.indexOf(this.content.charAt(this.index)) === -1 &&
      this.index < this.content.length
    ) {
      wordStash += this.content.charAt(this.index);
      this.index++;
    }
    this.currentToken = {
      token: wordStash,
      start,
      end: start + wordStash.length - 1,
    };
    return this.currentToken;
  }
}
