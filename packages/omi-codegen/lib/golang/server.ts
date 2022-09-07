import {
  VariableDeclarationNode,
  StructDeclarationNode,
  FormatNode,
  FunctionArgumentsNode,
  Method,
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  EnumContentNode,
  EnumDeclarationNode,
  ProgramNode,
} from "@omi-stack/omi-ast-parser";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
import { staticComment } from "../typescript/common";
import formatMap from "./format-map";

const variableDefaultValue = (ast: VariableDeclarationNode) => {
  if (ast.repeated) {
    return ` = new ${ast.format}[] {};`;
  }
  if (ast.format === "string") {
    return ' = "";';
  }
  if (!formatMap.has(ast.format)) {
    return ` = new ${ast.format}();`;
  }
  return "";
};

const generateStruct = (ast: StructDeclarationNode) => {
  const row = [];
  row.push(`type ${ast.identify} struct {`);
  for (const item of ast.content.body) {
    if (item.type === "VariableDeclaration") {
      row.push(
        `${item.identify} ${item.repeated ? "[]" : ""}${
          formatMap.get(item.format) ?? item.format
        }`
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
  const val = `${format.repeated ? "[]" : ""}${
    formatMap.get(format.format) ?? format.format
  }`;
  return val === "void" ? "" : val;
};

export const generateArgumentsType = (args: FunctionArgumentsNode) => {
  // 其余的请求类型直接把请求参数写入函数体中，让ASP.NET去自动获取
  const format: string[] = [];
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      format.push(
        `${item.identify} ${formatMap.get(item.format) ?? item.format}${
          item.repeated ? "[]" : ""
        }`
      );
    }
  }
  return format.join(",");
};

const generateFunction = (
  func: FunctionDeclarationNode,
  serviceIdentify: string
) => {
  const resp = responseType(func.returnType);
  const args = generateArgumentsType(func.arguments);
  return `${func.identify}(${args}) ${resp}`;
};

const generateService = (service: ServiceDeclarationNode) => {
  const row = [];
  row.push(`type ${service.identify} interface {`);
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      row.push(generateFunction(item, service.identify));
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
  row.push(`type _${service.identify}Definition struct {`);
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      const name = upperSnackMethodName(item.identify) + "_PATH";
      row.push(`${name} string`);
    }
  }

  row.push("}");

  row.push(
    `var ${service.identify}Definition = &_${service.identify}Definition{`
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

// enum分为两步，一步定义结构体，一步定义Value
export const generateEnum = (ast: EnumDeclarationNode) => {
  const row = [];
  const struct = `type ${ast.identify} struct {
    ${generateEnumContent(ast.content)}
  }`;
  row.push(struct);

  return row.join("\n");
};

const GolangServerGenerator = (program: ProgramNode) => {
  let content = staticComment + "\n";

  content += `package omi\n`;

  for (const item of program.body) {
    if (item.type === "StructDeclaration") {
      content += generateStruct(item) + "\n";
    }
    if (item.type === "ServiceDeclaration") {
      content += generateService(item) + "\n";
      content += generateDefinition(item) + "\n";
    }
    if (item.type === "EnumDeclaration") {
      content += generateEnum(item) + "\n";
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
  }
  return content;
};
export default GolangServerGenerator;
