import {
  keywords,
  methods,
  quoteChar,
  signalChar,
  splitChar,
} from "./constant";
import { initFormatMap } from "./lambda";
import {
  FormatStatus,
  VariableStatus,
  FunctionStatus,
  ServiceStatus,
  ProgramStatus,
  ImportStatus,
  EnumStatus,
  EnumOption,
} from "./status";
import {
  CommentsNode,
  EnumContentNode,
  EnumDeclarationNode,
  EnumOptionNode,
  FormatMapValue,
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  IdentifyNode,
  ImportContentNode,
  ImportDeclarationNode,
  ImportFormatNode,
  ImportPathNode,
  IParsedToken,
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
    row: 0,
    col: 0,
  };

  // *构建产物*
  // Token队列
  private tokenList: IParsedToken[] = [];
  // 抽象语法树
  private program: ProgramNode | undefined;
  // 类型声明
  private declaredFormatMap: Map<string, FormatMapValue> = initFormatMap();
  private usedFormatSet: Set<string> = new Set();

  setContent(value: string) {
    this.content = value;
    this.index = 0;
  }
  getContent() {
    return this.content;
  }

  // 状态机指针的位置信息
  private index: number = 0;
  // 行列信息，从0开始计算
  private row: number = 0;
  private col: number = 0;

  getPosition() {
    return {
      index: this.index,
      row: this.row,
      col: this.col,
    };
  }
  getCurrentToken() {
    return this.currentToken;
  }

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
          this.tokenList.push({
            line: this.currentToken.row,
            startCharacter: this.currentToken.col,
            length: this.currentToken.token.length,
            tokenType: "format",
            tokenModifiers: [],
          });

          repeated = true;
          this.readToken();
        } else if (this.currentToken.token === "optional") {
          this.tokenList.push({
            line: this.currentToken.row,
            startCharacter: this.currentToken.col,
            length: this.currentToken.token.length,
            tokenType: "format",
            tokenModifiers: [],
          });

          optional = true;
          this.readToken();
        } else {
          status = FormatStatus.Format;
        }

        continue;
      }
      if (status === FormatStatus.Format) {
        format = this.currentToken;

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "type",
          tokenModifiers: [],
        });

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

    // 若在定义变量前使用了format类型，将使用到的format记录在一个Set里，稍后进行校验
    if (!this.declaredFormatMap.has(format!.token)) {
      this.usedFormatSet.add(format!.token);
    }

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

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "variable",
          tokenModifiers: [],
        });

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

  wEnumOption(): EnumOptionNode {
    let status: EnumOption = EnumOption.Identify;

    const body: EnumOptionNode["body"] = [];
    let identify: string | undefined;
    const start = this.currentToken.start;

    while (status !== EnumOption.Finish) {
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      if (status === EnumOption.Identify) {
        const identifyNode = this.wIdentify();
        body.push(identifyNode);
        identify = identifyNode.token;
        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "variable",
          tokenModifiers: [],
        });
        this.readToken();
      }
      if (status === EnumOption.EndToken) {
        const end = this.currentToken;
        if (end.token !== ",") {
          throw new Error("Enum可选项必须以逗号结尾");
        }
      }

      status++;
    }
    const end = this.currentToken.end;

    if (!identify) {
      throw new Error("Enum可选项未声明名称");
    }

    return {
      type: "EnumOption",
      start,
      end,
      identify,
      body,
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

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "function",
          tokenModifiers: [],
        });

        const upperRegex = /^(GET|POST|PUT|PATCH|DELETE)[\w]+/;
        const regex = /^(Get|Post|Put|Patch|Delete)[\w]+/;
        if (
          upperRegex.test(identify.token.toUpperCase()) &&
          !regex.test(identify.token)
        ) {
          throw new Error(
            "若要使用Method+Name的方式进行命名，则Method必须以大驼峰形式进行书写"
          );
        }

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

    // 若用户没有在名称里定义Method，则默认使用Post Method
    let method: Method = "Post";
    methods.forEach((loopMethod) => {
      if (identify?.token.indexOf(loopMethod) === 0) {
        method = loopMethod;
      }
    });

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

    let skip = false;
    while (true) {
      if (!skip) {
        this.readToken();
      }
      skip = false;

      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        skip = true;
        continue;
      }

      if (this.currentToken.token === "}") {
        break;
      }

      const func = this.wFunction();
      body.push(func);
    }

    const content: ServiceContentNode = {
      type: "ServiceContent",
      start: token.start,
      end: this.currentToken.end,
      body,
    };

    return content;
  }

  wEnumContent(): EnumContentNode {
    const token = this.currentToken;
    if (token.token !== "{") {
      throw new Error("Enum的声明内容必须被包裹在 {} 里");
    }
    const body: EnumContentNode["body"] = [];
    const optionList: EnumContentNode["optionList"] = [];

    let skip = false;
    while (true) {
      if (!skip) {
        this.readToken();
      }
      skip = false;

      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        skip = true;
        continue;
      }

      if (this.currentToken.token === "}") {
        break;
      }

      const option = this.wEnumOption();
      if (optionList.indexOf(option.identify) !== -1) {
        throw new Error("Enum可选项不可重复命名");
      }
      optionList.push(option.identify);
      body.push(option);
    }

    return {
      start: token.start,
      end: this.currentToken.end,
      type: "EnumContent",
      optionList,
      body,
    };
  }

  wStructContent() {
    const token = this.currentToken;
    if (token.token !== "{") {
      throw new Error("Struct的声明内容必须被包裹在 {} 里");
    }
    const body: StructContentNode["body"] = [];

    let skip = false;
    while (true) {
      if (!skip) {
        this.readToken();
      }
      skip = false;

      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        skip = true;
        continue;
      }

      if (this.currentToken.token === "}") {
        break;
      }

      const variable = this.wVariable([";", "}"]);
      body.push(variable);
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

      this.tokenList.push({
        line: comment.row,
        startCharacter: comment.col,
        length: comment.content.length,
        tokenType: "comment",
        tokenModifiers: [],
      });

      this.readToken();
    } else if (this.currentToken.token.indexOf("/*") === 0) {
      comment = this.wCommentsBlock();
      this.readToken();
    }
    return comment;
  }

  wEnum(): EnumDeclarationNode {
    let status: EnumStatus = EnumStatus.Keyword;

    const body: EnumDeclarationNode["body"] = [];

    const start = this.currentToken.start;

    let identify: IdentifyNode | undefined;
    let content: EnumContentNode | undefined;

    while (status !== EnumStatus.Finish) {
      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      if (status === EnumStatus.Keyword) {
        // 将声明关键词写入body
        const keyword = this.wKeyword();

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "keyword",
          tokenModifiers: [],
        });

        body.push(keyword);
        this.readToken();
        status++;
        continue;
      }

      if (status === EnumStatus.Identify) {
        identify = this.wIdentify();

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "class",
          tokenModifiers: [],
        });

        body.push(identify);
        this.readToken();
        status++;
        continue;
      }

      if (status === EnumStatus.Content) {
        // 写入service的内容
        content = this.wEnumContent();
        body.push(content);
        status++;
        continue;
      }
    }

    // 将定义的Enum写入类型Map中
    this.declaredFormatMap.set(identify!.token, {
      origin: "declaration",
    });

    return {
      start,
      end: this.currentToken.end,
      type: "EnumDeclaration",
      identify: identify!.token,
      content: content!,
      body,
    };
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

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "keyword",
          tokenModifiers: [],
        });

        body.push(keyword);
        this.readToken();
        status++;
        continue;
      }
      if (status === ServiceStatus.Identify) {
        // 写入service的名称
        identify = this.wIdentify();

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "class",
          tokenModifiers: [],
        });

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

    this.tokenList.push({
      line: this.currentToken.row,
      startCharacter: this.currentToken.col,
      length: this.currentToken.token.length,
      tokenType: "keyword",
      tokenModifiers: [],
    });
    body.push(keyword);

    this.readToken();
    const identify = this.wIdentify();

    this.tokenList.push({
      line: this.currentToken.row,
      startCharacter: this.currentToken.col,
      length: this.currentToken.token.length,
      tokenType: "struct",
      tokenModifiers: [],
    });
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

    if (this.declaredFormatMap.has(identify.token)) {
      throw new Error(`不能在此处定义类型${identify.token}，因为它已被定义`);
    } else {
      this.declaredFormatMap.set(identify.token, {
        origin: "declaration",
      });
    }

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
      row: token.row,
      col: token.col,
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
      row: token.row,
      col: token.col,
      variant,
      content,
    };

    return comments;
  }

  wImportContent() {
    const start = this.currentToken.start;
    let body: ImportContentNode["body"] = [];
    let formats: ImportContentNode["formats"] = [];

    let skip = false;
    while (true) {
      if (!skip) {
        this.readToken();
      }

      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        skip = true;
        continue;
      }
      skip = false;

      const importFormat: ImportFormatNode = {
        type: "ImportFormatNode",
        start: this.currentToken.start,
        end: this.currentToken.end,
        format: this.currentToken.token,
      };

      this.tokenList.push({
        line: this.currentToken.row,
        startCharacter: this.currentToken.col,
        length: this.currentToken.token.length,
        tokenType: "struct",
        tokenModifiers: [],
      });

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

      // 读import关键字
      if (status === ImportStatus.KeywordImport) {
        const keyword = this.wKeyword();
        if (keyword.identify !== "import") {
          throw new Error(
            "在import语句中使用了错误的关键字，期望：import 实际：" +
              keyword.identify
          );
        }
        body.push(keyword);
        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "keyword",
          tokenModifiers: [],
        });

        status = ImportStatus.Content;
        this.readToken();
        continue;
      }

      // 读引入的数据结构声明
      if (status === ImportStatus.Content) {
        content = this.wImportContent();
        formats = content.formats;
        body.push(content);
        status = ImportStatus.KeywordFrom;
        this.readToken();
        continue;
      }

      // 读from关键字
      if (status === ImportStatus.KeywordFrom) {
        const keyword = this.wKeyword();
        if (keyword.identify !== "from") {
          throw new Error(
            "在import语句中使用了错误的关键字，期望：from 实际：" +
              keyword.identify
          );
        }

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "keyword",
          tokenModifiers: [],
        });

        body.push(keyword);
        status = ImportStatus.Path;
        this.readToken();
        continue;
      }

      // 读import 路径
      if (status === ImportStatus.Path) {
        path = this.wImportPath();

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "string",
          tokenModifiers: [],
        });

        body.push(path);
        status = ImportStatus.EndToken;
        this.readToken();
        continue;
      }

      // 读导入终止符
      if (status === ImportStatus.EndToken) {
        const token = this.currentToken;
        if (token.token !== ";") {
          throw new Error("Import 语句没有正确结束");
        }

        this.tokenList.push({
          line: this.currentToken.row,
          startCharacter: this.currentToken.col,
          length: this.currentToken.token.length,
          tokenType: "label",
          tokenModifiers: [],
        });

        body.push(token);
        status = ImportStatus.Finish;
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

    formats.forEach((format) => {
      if (this.declaredFormatMap.has(format)) {
        throw new Error(`不能导入类型${format}，因为它已被定义`);
      } else {
        this.declaredFormatMap.set(format, { origin: "import" });
      }
    });

    return importDeclaration;
  }

  // 状态机初始化运转状态，可接收的token类型有：注释、结构体声明、服务声明
  wProgramBody() {
    let status: ProgramStatus = ProgramStatus.Import;
    const body: ProgramNode["body"] = [];

    this.readToken();
    while (this.index < this.content.length) {
      const token = this.currentToken;
      let val: ProgramNode["body"][number] | undefined;

      const comment = this.wComments();
      if (comment) {
        body.push(comment);
        continue;
      }

      // 依赖导入阶段
      if (status === ProgramStatus.Import) {
        if (token.token === "import") {
          val = this.wImport();
        } else if (
          (<readonly string[]>keywords).indexOf(token.token) !== -1 &&
          token.token !== "import" &&
          token.token !== "from"
        ) {
          status = ProgramStatus.Declare;
        }
      }

      // IDL定义阶段
      if (status === ProgramStatus.Declare) {
        if (token.token === "service") {
          val = this.wService();
        } else if (token.token === "struct") {
          val = this.wStruct();
        } else if (token.token === "enum") {
          val = this.wEnum();
        }
      }
      if (!val) {
        throw new Error("获取到了未定义的关键字");
      }
      body.push(val);
      this.readToken();
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
    this.usedFormatSet.forEach((key) => {
      if (!this.declaredFormatMap.has(key)) {
        throw new Error(`使用了未被定义的类型${key}`);
      }
    });
    return program;
  }

  private errorHandler(func: () => ProgramNode) {
    try {
      return func();
    } catch (e) {
      console.error("token list:", this.tokenList);
      console.error(
        `错误位置：第${this.row}行 第${this.col} 列 token: ${this.currentToken.token}`
      );
      console.error(e);
      throw e;
    }
  }

  // 构建抽象语法树
  build(): ProgramNode {
    return this.errorHandler(() => this._build());
  }

  getProgram() {
    if (!this.program) {
      throw new Error("构建语法树的过程中出现了未知错误");
    }
    return this.program;
  }
  getAllToken() {
    return this.tokenList;
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
      if (this.content.charAt(this.index) === "\n") {
        this.row++;
        this.col = 0;
      } else {
        this.col++;
      }

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
      this.col++;

      this.currentToken = {
        type: "Text",
        token: char,
        row: this.row,
        col: this.col,
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
        this.col++;
        if (this.content.charAt(this.index) === "\n") {
          this.row++;
          this.col = 0;
        }
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
        this.col++;
      }
    }
    this.currentToken = {
      type: "Text",
      token: wordStash,
      start,
      row: this.row,
      col: this.col - wordStash.length,
      end: start + wordStash.length - 1,
    };
    return this.currentToken;
  }
}
