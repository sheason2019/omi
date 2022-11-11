import {
  ImportDeclarationNode,
  StructDeclarationNode,
  FunctionArgumentsNode,
  FormatNode,
  EnumContentNode,
  EnumDeclarationNode,
} from "@omi-stack/omi-ast-parser";
import formatMap from "./format-map";

const generateEnumContent = (ast: EnumContentNode) => {
  const row: string[] = [];
  for (const item of ast.body) {
    if (item.type === "Comments") {
      row.push(item.content);
    }
    if (item.type === "EnumOption") {
      row.push(`${item.identify},`);
    }
  }
  return row.join("\n");
};

export const generateEnum = (ast: EnumDeclarationNode) => {
  return `export enum ${ast.identify} {
    ${generateEnumContent(ast.content)}
  }`;
};

const coreRegex = /(\w+)\.omi$/;
export const generateImport = (
  importNode: ImportDeclarationNode,
  from: "client" | "server"
) => {
  const matches = coreRegex.exec(importNode.path);
  if (!matches) {
    console.error(importNode.path);
    throw new Error("错误的导入地址");
  }
  const coreName = matches[1];
  const formats = importNode.formats.join(",");
  return `import { ${formats} } from "./${coreName}-${from}";`;
};

export const generateStruct = (ast: StructDeclarationNode): string => {
  const row = [];
  row.push(`export interface ${ast.identify} {`);
  for (const item of ast.content.body) {
    if (item.type === "VariableDeclaration") {
      row.push(
        `  ${item.identify}${item.optional ? "?" : ""}: ${
          formatMap.get(item.format) ?? item.format
        }${item.repeated ? "[]" : ""};`
      );
    }
    if (item.type === "Comments") {
      if (item.variant === "block") {
        row.push(item.content);
      } else if (item.variant === "inline") {
        row[row.length - 1] += ` ${item.content}`;
      }
    }
  }
  row.push("}");
  return row.join("\n");
};

const timeStr = () => {
  const time = new Date();
  return (
    time.getFullYear() +
    "年" +
    (time.getMonth() + 1) +
    "月" +
    time.getDate() +
    "日 " +
    time.getHours() +
    ":" +
    time.getMinutes() +
    ":" +
    time.getSeconds()
  );
};

export const staticComment = `/**
* 本文件由Omi.js自动生成，谨慎改动！
* 生成时间：${timeStr()}.
*/`;

export const responseType = (format: FormatNode) => {
  const val = `${formatMap.get(format.format) ?? format.format}${
    format.repeated ? "[]" : ""
  } ${format.optional ? " | undefined" : ""}`;
  return val;
};
