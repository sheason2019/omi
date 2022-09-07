import {
  StructDeclarationNode,
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  EnumContentNode,
  EnumDeclarationNode,
  ProgramNode,
} from "@omi-stack/omi-ast-parser";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
import { staticComment } from "../typescript/common";
import formatMap from "./format-map";

const setFormatFlag = (format: string) => {
  return `%{format:${format}}%`;
};
const parseFormatFlag = (content: string) => {
  return content.replaceAll(/%\{format:(\w+)\}%/g, (match, identify) => {
    return formatMap.get(identify) ?? identify;
  });
};

const generateStruct = (ast: StructDeclarationNode) => {
  const row = [];
  row.push(`type ${ast.identify} struct {`);
  for (const item of ast.content.body) {
    if (item.type === "VariableDeclaration") {
      row.push(
        `${item.identify} ${item.repeated ? "[]" : ""}${setFormatFlag(
          item.format
        )} \`json:"${item.identify}"\``
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
  // 其余的请求类型直接把请求参数写入函数体中，让ASP.NET去自动获取
  const format: string[] = [];
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      format.push(
        `${item.identify} ${setFormatFlag(item.format)}${
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
  return parseFormatFlag(content);
};
export default GolangServerGenerator;
