import {
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  ProgramNode,
} from "@omi-stack/omi-ast-parser";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
import { staticComment } from "../typescript/common";
import { setFormatFlag } from "./format-map";

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

const generateFunction = (func: FunctionDeclarationNode) => {
  const resp = responseType(func.returnType);
  const args = generateArgumentsType(func.arguments);
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
      row.push(`${name}: "/${service.identify}.${methodName}",`);
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
  let hasContent = false;

  let content = staticComment + "\n";

  content += `package omi\n`;

  content += STATIC_IMPORT_SLOT + "\n\n";

  for (const item of program.body) {
    if (item.type === "ServiceDeclaration") {
      hasContent = true;
      content += generateService(item) + "\n";
      content += generateDefinition(item) + "\n";
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
  }

  if (!hasContent) {
    return null;
  }

  content = content.replace(STATIC_IMPORT_SLOT, staticImport());

  return content;
};
export default GolangServerGenerator;
