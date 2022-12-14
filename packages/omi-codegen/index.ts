import * as fs from "fs";
import crypto from "crypto";
import {
  ImportDeclarationNode,
  OmiParser,
  ProgramNode,
} from "@omi-stack/omi-ast-parser";
import TSClientGenerator from "./lib/typescript/client";
import TSServerGenerator from "./lib/typescript/server";
import GolangServerGenerator from "./lib/golang/server";
import GolangCommonGenerator from "./lib/golang/common";
import GolangClientGenerator from "./lib/golang/client";
import { parseFormatFlag } from "./lib/golang/format-map";
import suffixDeal from "./lib/golang/suffix-deal";
import { createTimeStampFile } from "./lib/common/create-time-stamp-file";

interface CodegenMapItem {
  // 文件的MD5码
  md5: string;
  // 文件的语法树内容
  program: ProgramNode;
  rootDir: string;
}

interface OutputItem {
  content: string | null;
  md5: string;
  packageName: string;
}

export class OmiCodegen {
  // 为了避免在批量生成IDL遇到错误时仍旧生成没有错误的部分IDL，这里使用一个Map缓存语法树信息
  codegenMap = new Map<string, CodegenMapItem>();

  static getMd5ByPath(path: string): string {
    // 获取IDL内容
    const content = fs.readFileSync(path).toString();
    // 创建内容的MD5摘要
    const md5 = crypto.createHash("md5").update(content).digest("hex");

    return md5;
  }

  // 解析import info并返回需要导入的路径
  parseImportInfo(program: ProgramNode, rootDir: string): string[] {
    const importNodes: ImportDeclarationNode[] = [];
    for (let i = 0; i < program.body.length; i++) {
      const node = program.body[i];
      if (node.type === "ImportDeclaration") {
        importNodes.push(node);
      } else if (node.type !== "Comments") {
        break;
      }
    }
    return importNodes.map((importNode) => rootDir + importNode.path);
  }

  parse(fileOrPath: string) {
    if (!fs.existsSync(fileOrPath)) {
      throw new Error("指定的文件或目录不存在");
    }
    const stat = fs.statSync(fileOrPath);
    const pathList = [];
    // 这里使用MD5而不是pathSet 是为了避免因为软连接之类的原因
    // 导致不同路径指向同一份文件而造成重复解析
    // 直接在读取文件内容后通过对比它们的MD5摘要来避免重复解析 看起来应该更稳妥一点
    const md5Set = new Set<string>();
    // 当前IDL目录，用来处理import 行为
    let rootDir = "";
    // 当前IDL名称，用来生成文件名
    let name = "";

    if (stat.isDirectory()) {
      const path =
        fileOrPath.charAt(fileOrPath.length - 1) === "/"
          ? fileOrPath
          : fileOrPath + "/";
      // 用户指定的是目录就把目录下的所有.omi文件parse出来
      fs.readdirSync(path)
        .filter((file) => /.omi$/g.test(file))
        .forEach((file) => {
          pathList.push(path + file);
        });
    } else if (stat.isFile()) {
      // 是文件就把文件内容parse出来
      pathList.push(fileOrPath);
    } else {
      throw new Error("未知的文件类型");
    }

    while (pathList.length > 0) {
      const path = pathList.shift();

      if (!path) {
        throw new Error("Path List为空导致的未知异常");
      }

      const splitIndex = path.lastIndexOf("/");
      if (splitIndex === -1) {
        rootDir = "";
        name = path;
      } else {
        rootDir = path.substring(0, splitIndex) + "/";
        name = path.substring(splitIndex + 1).replace(".omi", "");
      }

      // 实例化 parser
      const parser = new OmiParser();
      // 获取IDL内容
      const content = fs.readFileSync(path).toString();
      // 创建内容的MD5摘要
      const md5 = crypto.createHash("md5").update(content).digest("hex");
      // 如果已存在就跳到下一个文件
      if (md5Set.has(md5)) {
        continue;
      }
      // 将MD5文件添加到Set中
      md5Set.add(md5);

      parser.setContent(content);
      let program: ProgramNode;
      try {
        program = parser.build();
      } catch (e) {
        console.error(`解析文件 ${path} 时发生错误`);
        throw e;
      }
      // 解析抽象语法树中的导入信息，并写入pathList
      this.parseImportInfo(program, rootDir).forEach((importItem) =>
        pathList.push(importItem)
      );
      // 处理一下命名冲突的问题
      if (this.codegenMap.has(name)) {
        let index = 1;
        while (true) {
          const conflictName = name + "-conflict-" + index;
          if (this.codegenMap.has(conflictName)) {
            index++;
          } else {
            name = conflictName;
            break;
          }
        }
        console.warn(
          "警告：IDL命名产生了冲突，Path为 " +
            path +
            " 的文件名已被自动命名为 " +
            name
        );
      }
      this.codegenMap.set(name, { program, md5, rootDir });
    }
  }

  toTypescript(
    target: "client" | "server" | "both",
    targetDir: string,
    commonjs: boolean
  ) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    // 这里做一层缓存，确保Codegen一定是在IDL全部解析正确的情况下，才会生成到用户的硬盘里
    const outputMap = new Map<string, string>();

    this.codegenMap.forEach((item, key) => {
      const { program, md5 } = item;

      if (!program) {
        throw new Error("没有可用的语法树");
      }
      const contents = {
        client: "",
        server: "",
      };

      if (target !== "client") {
        contents.server = TSServerGenerator(program);
        outputMap.set(`${targetDir}/${key}-server.ts`, contents.server);
      }
      if (target !== "server") {
        contents.client = TSClientGenerator(program, commonjs);
        outputMap.set(`${targetDir}/${key}-client.ts`, contents.client);
      }
    });

    outputMap.forEach((content, key) => {
      fs.writeFileSync(key, outputMap.get(key)!);
    });
    createTimeStampFile(targetDir);
  }

  toGo(
    target: "server" | "client" | "both",
    targetDir: string,
    packageRoot: string
  ) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    // 这里做一层缓存，确保Codegen一定是在IDL全部解析正确的情况下，才会生成到用户的硬盘里
    const outputMap = new Map<string, OutputItem>();

    this.codegenMap.forEach((item, key) => {
      const { program, md5, rootDir } = item;

      if (!program) {
        throw new Error("没有可用的语法树");
      }
      const contents: Record<string, string | null> = {
        common: null,
        client: null,
        server: null,
      };

      contents.common = GolangCommonGenerator(program, md5, rootDir, key);
      if (target !== "client") {
        contents.server = GolangServerGenerator(program, md5, rootDir);
      }
      if (target !== "server") {
        contents.client = GolangClientGenerator(program, md5, rootDir);
      }

      const packContent = (content: string | null): OutputItem => ({
        content,
        md5,
        packageName: key,
      });

      const pathPrefix = `${targetDir}/${key}`;
      try {
        fs.mkdirSync(pathPrefix);
      } catch (_) {}
      outputMap.set(
        `${pathPrefix}/${key}-common.go`,
        packContent(contents.common)
      );
      outputMap.set(
        `${pathPrefix}/${key}-server.go`,
        packContent(contents.server)
      );
      outputMap.set(
        `${pathPrefix}/${key}-client.go`,
        packContent(contents.client)
      );
    });

    outputMap.forEach((item, key) => {
      const { content, packageName, md5 } = item;
      if (content !== null) {
        fs.writeFileSync(
          key,
          suffixDeal(content, packageName, md5, packageRoot)
        );
      }
    });

    createTimeStampFile(targetDir)
  }
}

export default OmiCodegen;
