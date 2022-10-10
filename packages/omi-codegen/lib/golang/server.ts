import {
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  ProgramNode,
  ImportDeclarationNode,
} from "@omi-stack/omi-ast-parser";
import OmiCodegen from "../../index";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
import { staticComment } from "../typescript/common";
import { setFormatFlag } from "./format-map";

let md5: string;
let importFormatMap: Map<string, string>;

const handleSetFormatFlag = (format: string) => {
  let inputMd5: string;
  if (importFormatMap.has(format)) {
    inputMd5 = importFormatMap.get(format)!;
  } else {
    inputMd5 = md5;
  }

  return setFormatFlag(format, inputMd5);
};

export const responseType = (format: FormatNode) => {
  const val = `${format.repeated ? "[]" : ""}${handleSetFormatFlag(
    format.format
  )}`;
  return val === "void" ? "" : val;
};

export const generateArgumentsType = (args: FunctionArgumentsNode) => {
  const format: string[] = ["ctx *gin.Context"];
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      format.push(
        `${item.identify} ${item.repeated ? "[]" : ""}${handleSetFormatFlag(
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

const handleImport = (node: ImportDeclarationNode, rootDir: string) => {
  const fullPath = rootDir + node.path;
  const md5 = OmiCodegen.getMd5ByPath(fullPath);

  node.formats.forEach((format) => {
    importFormatMap.set(format, md5);
  });
};

const GolangServerGenerator = (
  program: ProgramNode,
  fileMd5: string,
  rootDir: string
) => {
  md5 = fileMd5;
  importFormatMap = new Map();

  let hasContent = false;

  let content = staticComment + "\n";

  content += `package omi\n`;

  content += STATIC_IMPORT_SLOT + "\n\n";

  for (const item of program.body) {
    if (item.type === "ImportDeclaration") {
      handleImport(item, rootDir);
    }
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
