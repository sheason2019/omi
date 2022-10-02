import {
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  ProgramNode,
  Method,
} from "@omi-stack/omi-ast-parser";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
import { staticComment } from "../typescript/common";
import formatMap from "./format-map";

// 通过函数参数生成一个便于Gin框架的bindJSON绑定的Request数据类型
const requestTypeStack = <string[]>[];

const setFormatFlag = (format: string) => {
  return `%{format:${format}}%`;
};
const parseFormatFlag = (content: string) => {
  return content.replaceAll(/%\{format:(\w+)\}%/g, (match, identify) => {
    return formatMap.get(identify) ?? identify;
  });
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

// Golang的public需要通过首字母大写来实现
const firstLetterUppercase = (str: string) => {
  return str[0].toUpperCase() + str.substring(1);
};

const addRequestType = (
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
        `${firstLetterUppercase(item.identify)} ${
          item.repeated ? "[]" : ""
        }${setFormatFlag(item.format)} \`${bindMehod}:"${item.identify}"\``
      );
      variableCount++;
    }
  }
  row.push("}");
  if (variableCount > 0) {
    requestTypeStack.push(row.join("\n"));
  }
};

const generateFunction = (func: FunctionDeclarationNode) => {
  const resp = responseType(func.returnType);
  const args = generateArgumentsType(func.arguments);
  addRequestType(func.arguments, func.identify, func.method);
  return `${func.identify}(${args}) ${resp}`;
};

const generateService = (service: ServiceDeclarationNode) => {
  const row = [];
  row.push(`type ${service.identify} interface {`);
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      row.push(generateFunction(item));
    }
    if (item.type === "Comments") {
      if (item.variant === "block") row.push(item.content);
    }
  }
  row.push("}");
  return row.join("\n");
};

const generateDefinition = (service: ServiceDeclarationNode) => {
  const row = [];
  row.push(`type Type${service.identify}Definition struct {`);
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      const name = upperSnackMethodName(item.identify) + "_PATH";
      row.push(`${name} string`);
    }
  }

  row.push("}");

  row.push(
    `var ${service.identify}Definition = &Type${service.identify}Definition{`
  );
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      const name = upperSnackMethodName(item.identify) + "_PATH";
      const methodName = item.identify.replace(item.method, "");
      row.push(`${name}: "${service.identify}.${methodName}",`);
    }
  }
  row.push("}");
  return row.join("\n");
};

// 因为某些IDL可能只有数据结构存在，它们的生成产物不需要引入gin框架的ctx
// 所以这里使用注释的方式标注出Import内容的插入位置
// 在需要插入Import内容时使用Replace方法将Import内容写进去
const STATIC_IMPORT_SLOT = "// [%STATIC_IMPORT SLOT%]";

const staticImport = () => {
  const row = [];
  row.push("import (");
  row.push('"github.com/gin-gonic/gin"');
  row.push(")");
  return row.join("\n");
};

const GolangServerGenerator = (program: ProgramNode) => {
  let content = staticComment + "\n";

  let shouldAddImport = false;

  content += `package omi\n`;

  content += STATIC_IMPORT_SLOT + "\n\n";

  for (const item of program.body) {
    if (item.type === "ServiceDeclaration") {
      shouldAddImport = true;
      content += generateService(item) + "\n";
      content += generateDefinition(item) + "\n";
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
  }

  while (requestTypeStack.length > 0) {
    content += requestTypeStack.pop() + "\n";
  }

  if (shouldAddImport) {
    content = content.replace(STATIC_IMPORT_SLOT, staticImport());
  } else {
    content = content.replace(STATIC_IMPORT_SLOT, "");
  }

  return parseFormatFlag(content);
};
export default GolangServerGenerator;
