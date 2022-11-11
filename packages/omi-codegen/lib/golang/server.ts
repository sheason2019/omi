import {
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  ProgramNode,
} from "@omi-stack/omi-ast-parser";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
import { staticComment } from "../typescript/common";
import { handleImport } from "./common";
import { handleSetFormatFlag } from "./format-map";
import { updateImportFlag } from "./import";
import { setPackageFlag } from "./package";

let md5: string;
let importFormatMap: Map<string, string>;
let importUsedMap: Map<string, boolean>;

export const responseType = (format: FormatNode) => {
  const val = `${format.repeated ? "[]" : ""}${handleSetFormatFlag(
    format.format,
    md5,
    importFormatMap,
    importUsedMap
  )}`;
  return val === "void" ? "" : val;
};

export const generateArgumentsType = (args: FunctionArgumentsNode) => {
  const format: string[] = ["ctx *gin.Context"];
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      format.push(
        `${item.identify} ${item.repeated ? "[]" : ""}${handleSetFormatFlag(
          item.format,
          md5,
          importFormatMap,
          importUsedMap
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
  row.push(`type type${service.identify}Definition struct {`);
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      const name = upperSnackMethodName(item.identify) + "_PATH";
      row.push(`${name} string`);
    }
  }

  row.push("}");

  row.push(
    `var ${service.identify}Definition = &type${service.identify}Definition{`
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

const GolangServerGenerator = (
  program: ProgramNode,
  fileMd5: string,
  rootDir: string
) => {
  md5 = fileMd5;
  importFormatMap = new Map();
  importUsedMap = new Map();

  let hasContent = false;

  let content = staticComment + "\n";

  content += setPackageFlag() + "\n";

  content += STATIC_IMPORT_SLOT + "\n\n";

  for (const item of program.body) {
    if (item.type === "ImportDeclaration") {
      content += handleImport(item, rootDir, importFormatMap);
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

  content = updateImportFlag(content, importUsedMap);

  return content;
};
export default GolangServerGenerator;
