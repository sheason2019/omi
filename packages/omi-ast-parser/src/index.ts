import {
  keywords,
  methods,
  quoteChar,
  signalChar,
  splitChar,
} from "./constant";
import {
  FormatStatus,
  VariableStatus,
  FunctionStatus,
  ServiceStatus,
  ProgramStatus,
  ImportStatus,
} from "./status";
import {
  CommentsNode,
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  IdentifyNode,
  ImportContentNode,
  ImportDeclarationNode,
  ImportFormatNode,
  ImportPathNode,
  KeywordNode,
  Method,
  ProgramNode,
  ServiceContentNode,
  ServiceDeclarationNode,
  StructContentNode,
  StructDeclarationNode,
  TokenValue,
  VariableDeclarationNode,
} from "./typings";

export class OmiParser {
  // 用来解析的内容
  private content: string = "";

  private currentToken: TokenValue = {
    type: "Text",
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
    let status: FormatStatus = FormatStatus.Properties;

    const start = this.currentToken.start;

    let repeated = false;
    let optional = false;
    let format: TokenValue | undefined;
    const body: FormatNode["body"] = [];

    while (status !== FormatStatus.Finish) {
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      if (status === FormatStatus.Properties) {
        if (this.currentToken.token === "repeated") {
          repeated = true;
          this.readToken();
        } else if (this.currentToken.token === "optional") {
          optional = true;
          this.readToken();
        } else {
          status = FormatStatus.Format;
        }

        continue;
      }
      if (status === FormatStatus.Format) {
        format = this.currentToken;
        body.push(format);
        status = FormatStatus.Finish;
        continue;
      }
    }

    const formatNode: FormatNode = {
      type: "Format",
      format: format!.token,
      start,
      end: this.currentToken.end,
      optional,
      repeated,
      body,
    };
    return formatNode;
  }

  wVariable(splitChar: ("," | ";" | ")" | "}")[]) {
    let status: VariableStatus = VariableStatus.Format;

    const start = this.currentToken.start;
    const body: VariableDeclarationNode["body"] = [];

    let format: FormatNode | undefined;
    let identify: IdentifyNode | undefined;
    let end: TokenValue = this.currentToken;

    while (status !== VariableStatus.Finish) {
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      if (status === VariableStatus.Format) {
        format = this.wFormat();
        body.push(format);
        this.readToken();
      }
      if (status === VariableStatus.Identify) {
        identify = this.wIdentify();
        body.push(identify);
        this.readToken();
      }
      if (status === VariableStatus.EndToken) {
        end = this.currentToken;
        if ((<string[]>splitChar).indexOf(end.token) === -1) {
          throw new Error(
            "变量声明没有应用正确的终止符：" + JSON.stringify(end)
          );
        }
      }

      status++;
    }

    const variable: VariableDeclarationNode = {
      type: "VariableDeclaration",
      start,
      end: this.currentToken.end,
      format: format!.format,
      identify: identify!.token,
      repeated: format!.repeated,
      optional: format!.optional,
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
    let status: FunctionStatus = FunctionStatus.ReturnType;

    const body: FunctionDeclarationNode["body"] = [];

    let returnType: FormatNode | undefined;
    let identify: IdentifyNode | undefined;
    let args: FunctionArgumentsNode | undefined;
    let end: TokenValue = this.currentToken;

    while (status !== FunctionStatus.Finish) {
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      if (status === FunctionStatus.ReturnType) {
        returnType = this.wFormat();
        body.push(returnType);
        this.readToken();
      }
      if (status === FunctionStatus.Identify) {
        identify = this.wIdentify();
        body.push(identify);
        this.readToken();
      }
      if (status === FunctionStatus.Args) {
        args = this.wFunctionArguments();
        body.push(args);
        this.readToken();
      }
      if (status === FunctionStatus.EndToken) {
        end = this.currentToken;
        if (end.token !== ";") {
          throw new Error("函数定义必须以分号作为结尾");
        }
      }

      status++;
    }

    let method: Method | undefined;
    methods.forEach((loopMethod) => {
      if (identify?.token.indexOf(loopMethod)) {
        method = loopMethod;
      }
    });
    if (!method) {
      throw new Error(`函数 ${identify?.token} 未定义正确的Method类型`);
    }

    const func: FunctionDeclarationNode = {
      type: "FunctionDeclaration",
      start: returnType!.start,
      end: end.end,
      returnType: returnType!,
      identify: identify!.token,
      arguments: args!,
      method,
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
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

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
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

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

    if ((<readonly string[]>keywords).indexOf(token.token) === -1) {
      throw new Error("未知的关键字类型");
    }
    let identify: KeywordNode["identify"] = <typeof keywords[number]>(
      token.token
    );

    const keyword: KeywordNode = {
      type: "Keyword",
      token: token,
      identify,
      start: token.start,
      end: token.end,
    };
    return keyword;
  }

  wComments() {
    let comment: CommentsNode | undefined;
    if (this.currentToken.token.indexOf("//") === 0) {
      comment = this.wCommentsRow();
      this.readToken();
    } else if (this.currentToken.token.indexOf("/*") === 0) {
      comment = this.wCommentsBlock();
      this.readToken();
    }
    return comment;
  }

  // 构建Service语法树
  wService() {
    let status: ServiceStatus = ServiceStatus.Keyword;

    const body: ServiceDeclarationNode["body"] = [];

    const start = this.currentToken.start;

    let identify: IdentifyNode | undefined;
    let content: ServiceContentNode | undefined;

    while (status !== ServiceStatus.Finish) {
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      if (status === ServiceStatus.Keyword) {
        // 将声明关键词写入body
        const keyword = this.wKeyword();
        body.push(keyword);
        this.readToken();
        status++;
        continue;
      }
      if (status === ServiceStatus.Identify) {
        // 写入service的名称
        identify = this.wIdentify();
        body.push(identify);
        this.readToken();
        status++;
        continue;
      }
      if (status === ServiceStatus.Content) {
        // 写入service的内容
        content = this.wServiceContent();
        body.push(content);
        status++;
        continue;
      }
    }

    const service: ServiceDeclarationNode = {
      type: "ServiceDeclaration",
      body,
      start: start,
      end: content!.end,
      identify: identify!.token,
      content: content!,
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

  wCommentsRow() {
    const token = this.currentToken;

    // 向前寻找字符，确认自己是否为独立成行的注释
    let point = this.index - 3;
    let variant: CommentsNode["variant"] = "block";
    while (point > -1) {
      if (/\S/.test(this.content.charAt(point))) {
        variant = "inline";
        break;
      }
      if (this.content.charAt(point) === "\n") {
        break;
      }
      point--;
    }
    // 读取整行内容
    let wordStash = "";
    while (this.content.charAt(this.index) !== "\n") {
      wordStash += this.content.charAt(this.index++);
    }
    const content = token.token + wordStash;

    const comments: CommentsNode = {
      type: "Comments",
      start: token.start,
      end: token.end + content.length,
      variant,
      content,
    };

    return comments;
  }

  wCommentsBlock() {
    const token = this.currentToken;

    // 向前寻找字符，确认自己是否为独立成行的注释
    let point = this.index - 3;
    let variant: CommentsNode["variant"] = "block";
    while (point > -1) {
      if (/\S/.test(this.content.charAt(point))) {
        variant = "inline";
        break;
      }
      if (this.content.charAt(point) === "\n") {
        break;
      }
      point--;
    }

    let wordStash = token.token;
    // 读取注释块的内容
    while (!/^\/\*[\S\s]+\*\/$/.test(wordStash)) {
      wordStash += this.content.charAt(this.index++);
    }
    const content = wordStash;

    const comments: CommentsNode = {
      type: "Comments",
      start: token.start,
      end: token.start + wordStash.length - 1,
      variant,
      content,
    };
    return comments;
  }

  wImportContent() {
    const start = this.currentToken.start;
    let body: ImportContentNode["body"] = [];
    let formats: ImportContentNode["formats"] = [];

    this.readToken();
    while (true) {
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      const importFormat: ImportFormatNode = {
        type: "ImportFormatNode",
        start: this.currentToken.start,
        end: this.currentToken.end,
        format: this.currentToken.token,
      };
      body.push(importFormat);
      formats.push(importFormat.format);
      const token = this.readToken();
      if (token.token === "}") {
        break;
      } else if (token.token === ",") {
        continue;
      } else {
        throw new Error("Import的类型声明没有正确的终止符");
      }
    }

    const end = this.currentToken.end;
    const content: ImportContentNode = {
      type: "ImportContentNode",
      start,
      end,
      body,
      formats,
    };
    return content;
  }

  wImportPath() {
    const content = this.currentToken.token;

    let path: string | undefined;

    if (/\"([\S\s]+)\"/.test(content)) {
      path = /\"([\S\s]+)\"/.exec(content)?.at(1);
    }
    if (/\'([\S\s]+)\'/.test(content)) {
      path = /\'([\S\s]+)\'/.exec(content)?.at(1);
    }

    if (!path) {
      throw new Error("不合法的import路径");
    }

    const importPath: ImportPathNode = {
      type: "ImportPathNode",
      start: this.currentToken.start,
      end: this.currentToken.end,
      content: this.currentToken,
      path,
    };
    return importPath;
  }

  // import属性的处理
  wImport(): ImportDeclarationNode {
    let status: ImportStatus = ImportStatus.KeywordImport;

    const start = this.currentToken.start;

    let body: ImportDeclarationNode["body"] = [];
    let formats: string[] = [];
    let content: ImportContentNode | undefined;
    let path: ImportPathNode | undefined;

    while (status !== ImportStatus.Finish) {
      const comments = this.wComments();
      if (comments) {
        body.push(comments);
        continue;
      }

      if (status === ImportStatus.KeywordImport) {
        const keyword = this.wKeyword();
        if (keyword.identify !== "import") {
          throw new Error(
            "在import语句中使用了错误的关键字，期望：import 实际：" +
              keyword.identify
          );
        }
        body.push(keyword);
        status = ImportStatus.Content;
        this.readToken();
        continue;
      }
      if (status === ImportStatus.Content) {
        content = this.wImportContent();
        formats = content.formats;
        body.push(content);
        status = ImportStatus.KeywordFrom;
        this.readToken();
        continue;
      }
      if (status === ImportStatus.KeywordFrom) {
        const keyword = this.wKeyword();
        if (keyword.identify !== "from") {
          throw new Error(
            "在import语句中使用了错误的关键字，期望：from 实际：" +
              keyword.identify
          );
        }
        body.push(keyword);
        status = ImportStatus.Path;
        this.readToken();
        continue;
      }
      if (status === ImportStatus.Path) {
        path = this.wImportPath();
        body.push(path);
        status = ImportStatus.EndToken;
        this.readToken();
        continue;
      }
      if (status === ImportStatus.EndToken) {
        const token = this.currentToken;
        if (token.token !== ";") {
          throw new Error("Import 语句没有正确结束");
        }
        body.push(token);
        status = ImportStatus.Finish;
        this.readToken();
        continue;
      }
    }

    const end = this.currentToken.end;
    const importDeclaration: ImportDeclarationNode = {
      type: "ImportDeclaration",
      start,
      end,
      body,
      formats,
      path: path!.path,
    };
    return importDeclaration;
  }

  // 状态机初始化运转状态，可接收的token类型有：注释、结构体声明、服务声明
  wProgramBody() {
    let status: ProgramStatus = ProgramStatus.Import;
    const body: ProgramNode["body"] = [];

    while (this.index < this.content.length) {
      const token = this.readToken();
      let val: ProgramNode["body"][number] | undefined;

      // 不管在什么情况下都可以写入注释
      if (token.token.indexOf("//") === 0) {
        val = this.wCommentsRow();
        body.push(val);
        continue;
      } else if (token.token.indexOf("/*") === 0) {
        val = this.wCommentsBlock();
        body.push(val);
        continue;
      }

      // 依赖导入阶段
      if (status === ProgramStatus.Import) {
        if (token.token === "import") {
          val = this.wImport();
        } else if (token.token === "service" || token.token === "struct") {
          status = ProgramStatus.Declare;
        }
      }

      // IDL定义阶段
      if (status === ProgramStatus.Declare) {
        if (token.token === "service") {
          val = this.wService();
        } else if (token.token === "struct") {
          val = this.wStruct();
        }
      }
      if (!val) {
        throw new Error("获取到了未定义的关键字");
      }
      body.push(val);
    }

    return body;
  }

  private _build() {
    const body: ProgramNode["body"] = this.wProgramBody();

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
      let row = 1;
      let col = 1;
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
  build(): ProgramNode {
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
      this.currentToken = {
        type: "Text",
        token: char,
        start,
        end: start + char.length - 1,
      };
      return this.currentToken;
    }

    let wordStash = "";
    // 检测到了字符串Token
    if (quoteChar.indexOf(char) !== -1) {
      while (
        !/^\'[\S\s]*\'/.test(wordStash) &&
        !/^\"[\S\s]*\"$/.test(wordStash) &&
        this.index < this.content.length
      ) {
        const char = this.content.charAt(this.index);
        wordStash += char;
        this.index++;
      }
    } else {
      while (
        splitChar.indexOf(this.content.charAt(this.index)) === -1 &&
        this.index < this.content.length
      ) {
        if (
          wordStash.length &&
          this.content.charAt(this.index) === "/" &&
          wordStash.charAt(0) !== "/"
        ) {
          break;
        }
        if (/^\/\*[\S\s]+\*\/$/.test(wordStash)) {
          break;
        }
        const char = this.content.charAt(this.index);
        wordStash += char;
        this.index++;
      }
    }
    this.currentToken = {
      type: "Text",
      token: wordStash,
      start,
      end: start + wordStash.length - 1,
    };
    return this.currentToken;
  }
}
