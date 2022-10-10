import {
  StructDeclarationNode,
  FormatNode,
  FunctionArgumentsNode,
  EnumContentNode,
  EnumDeclarationNode,
  ProgramNode,
  ServiceDeclarationNode,
  Method,
} from "@omi-stack/omi-ast-parser";
import { staticComment } from "../typescript/common";
import formatMap, { setFormatFlag } from "./format-map";

const generateStruct = (ast: StructDeclarationNode) => {
  const row = [];
  row.push(`type ${ast.identify} struct {`);
  for (const item of ast.content.body) {
    if (item.type === "VariableDeclaration") {
      row.push(
        `${item.identify} *${item.repeated ? "[]" : ""}${setFormatFlag(
          item.format
        )}`
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

export const responseType = (format: FormatNode) => {
  const val = `${format.repeated ? "[]" : ""}${setFormatFlag(format.format)}`;
  return val === "void" ? "" : val;
};

export const generateArgumentsType = (args: FunctionArgumentsNode) => {
  const format: string[] = ["ctx *gin.Context"];
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      format.push(
        `${item.identify} ${item.repeated ? "[]" : ""}${setFormatFlag(
          item.format
        )}`
      );
    }
  }
  return format.join(",");
};

const generateEnumContent = (ast: EnumContentNode) => {
  const row: string[] = [];
  for (const item of ast.body) {
    if (item.type === "Comments") {
      row.push(item.content);
    }
    if (item.type === "EnumOption") {
      row.push(`${item.identify} int`);
    }
  }
  return row.join("\n");
};

const generateEnumValue = (ast: EnumContentNode) => {
  const row: string[] = [];
  let value = 0;
  for (const item of ast.body) {
    if (item.type === "EnumOption") {
      row.push(`${item.identify}: ${value++},`);
    }
  }
  return row.join("\n");
};

// enum分为两步，一步定义结构体，一步定义Value
export const generateEnum = (ast: EnumDeclarationNode) => {
  const row = [];
  const struct = `type S${ast.identify} struct {
    ${generateEnumContent(ast.content)}
  }`;
  row.push(struct);

  const value = `var ${ast.identify} = &S${ast.identify} {
    ${generateEnumValue(ast.content)}
  }`;
  row.push(value);

  formatMap.set(ast.identify, "int");

  return row.join("\n");
};

const generateRequestTypeGroup = (service: ServiceDeclarationNode) => {
  const row = [];
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      row.push(generateRequestType(item.arguments, item.identify, item.method));
    }
  }
  return row.join("\n");
};

// Golang的public需要通过首字母大写来实现
export const firstLetterUppercase = (str: string) => {
  return str[0].toUpperCase() + str.substring(1);
};

const generateRequestType = (
  args: FunctionArgumentsNode,
  funcIdentify: string,
  method: Method
) => {
  let variableCount = 0;
  let bindMehod: string;
  if (method === "Get" || method === "Delete") {
    bindMehod = "form";
  } else {
    bindMehod = "json";
  }
  const row: string[] = [];
  row.push(`type ${funcIdentify}Request struct {`);
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      row.push(
        `${firstLetterUppercase(item.identify)} ${item.repeated ? "[]" : ""
        }${setFormatFlag(item.format)} \`${bindMehod}:"${item.identify}"\``
      );
      variableCount++;
    }
  }
  row.push("}");

  return row.join("\n");
};

const GolangCommonGenerator = (program: ProgramNode) => {
  let content = staticComment + "\n";

  content += `package omi\n`;

  for (const item of program.body) {
    if (item.type === "StructDeclaration") {
      content += generateStruct(item) + "\n";
    }
    if (item.type === "EnumDeclaration") {
      content += generateEnum(item) + "\n";
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
    if (item.type === "ServiceDeclaration") {
      content += generateRequestTypeGroup(item) + "\n";
    }
  }

  return content;
};
export default GolangCommonGenerator;
