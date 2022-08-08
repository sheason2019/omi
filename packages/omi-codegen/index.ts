import * as fs from "fs";
import Parser from "omi-ast-parser";
import ClientGenerator from "./lib/typescript/client";
import ServerGenerator from "./lib/typescript/server";

export class OmiCodegen {
  content?: string;

  setContent(content: string) {
    this.content = content;
  }

  parseAST() {
    if (!this.content) {
      return null;
    }
    const parser = new Parser();

    parser.setContent(this.content);

    try {
      const ast = parser.build();
      return ast;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  toTypescript(
    target: "client" | "server" | "both",
    fileName: string,
    targetDir: string
  ) {
    const ast = this.parseAST();
    if (!ast) {
      throw new Error("没有解析出可用的抽象语法树");
    }
    const contents = {
      client: "",
      server: "",
    };
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }
    if (target !== "client") {
      contents.server = ServerGenerator(ast);
      fs.writeFileSync(`${targetDir}/${fileName}-server.ts`, contents.server);
    }
    if (target !== "server") {
      contents.client = ClientGenerator(ast);
      fs.writeFileSync(`${targetDir}/${fileName}-client.ts`, contents.client);
    }
  }
}

export default OmiCodegen;
