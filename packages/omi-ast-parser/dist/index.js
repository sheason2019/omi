"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Status;
(function (Status) {
    Status[Status["Init"] = 1] = "Init";
    Status[Status["Parsing"] = 2] = "Parsing";
    Status[Status["Fulfilled"] = 3] = "Fulfilled";
})(Status || (Status = {}));
// parser负责把文本编译成AST
const splitChar = [" ", "\n", "(", ")", "{", "}", ";", ","];
class Parser {
    constructor() {
        this.index = 0;
        this.content = "";
        this.tree = [];
        this.status = Status.Init;
        this.formatMap = new Map();
        this.formatMap.set("int32", {});
        this.formatMap.set("int64", {});
        this.formatMap.set("double", {});
        this.formatMap.set("string", {});
        this.formatMap.set("boolean", {});
    }
    setContent(content) {
        this.content = content;
    }
    wKeyword(word) {
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
        if (!word.length) {
            // 已经到头了
            // console.log("文件解析完毕");
            this.status = Status.Fulfilled;
            return null;
        }
        throw new Error("解析到了未经定义的关键字：" + word);
    }
    wVariable(format, stopChars) {
        if (!this.formatMap.has(format)) {
            throw new Error("未经定义的数据类型：" + format);
        }
        const varTree = {
            format,
        };
        const name = this.readWord();
        varTree.name = name;
        const stopChar = this.readWord();
        if (stopChars.indexOf(stopChar) === -1) {
            throw new Error("变量定义后必须有终止符");
        }
        return {
            format: varTree.format,
            name: varTree.name,
            type: "variable",
        };
    }
    wRequestArguments() {
        const prefix = this.readWord();
        if (prefix !== "(") {
            throw new Error("请求参数必须放在括号'()'内");
        }
        const args = [];
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
    wFunction(responseType) {
        if (!this.formatMap.has(responseType)) {
            throw new Error("未经定义的数据类型：" + responseType);
        }
        const name = this.readWord();
        const requestArguments = this.wRequestArguments();
        return {
            type: "function",
            name,
            requestArguments,
            responseType,
        };
    }
    wIntend(node) {
        const prefix = this.readWord();
        if (prefix !== "{") {
            throw new Error("结构体或服务的名称后面应该使用大括号进行内容声明");
        }
        node.items = [];
        while (this.status === Status.Parsing) {
            const word = this.readWord();
            if (word === "}")
                break;
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
    wStruct(node) {
        node.type = "struct";
        const name = this.readWord();
        node.name = name;
        this.wIntend(node);
        // 完成Struct的定义后需要将定义好的Struct添加到允许的数据类型中
        this.formatMap.set(node.name, Object.assign(Object.assign({}, node), { name: undefined }));
        return node;
    }
    wService(node) {
        node.type = "service";
        const name = this.readWord();
        node.name = name;
        this.wIntend(node);
        return node;
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
        if (!this.content)
            throw new Error("Content内容不存在");
        if (this.index > this.content.length) {
            throw new Error("parser指针已越界");
        }
    }
    skipSpace() {
        this.errorChecker();
        const char = this.content.charAt(this.index);
        if (char === " " || char === "\n") {
            this.index++;
            return this.skipSpace();
        }
        if (this.index > this.content.length) {
            this.status = Status.Fulfilled;
        }
        return;
    }
    readWord() {
        this.skipSpace();
        let wordStash = "";
        const char = this.content.charAt(this.index);
        if (char === "{" ||
            char === "}" ||
            char === "(" ||
            char === ")" ||
            char === ";") {
            this.index++;
            return char;
        }
        while (splitChar.indexOf(this.content.charAt(this.index)) === -1 &&
            this.index < this.content.length) {
            wordStash += this.content.charAt(this.index);
            this.index++;
        }
        return wordStash;
    }
}
exports.default = Parser;
