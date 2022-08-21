import {
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  ProgramNode,
  ServiceDeclarationNode,
  StructDeclarationNode,
} from "@omi-stack/omi-ast-parser";
import { staticComment } from "../typescript/common";
import formatMap from "./format-map";

const requestDefineStack: string[] = [];

const generateStruct = (ast: StructDeclarationNode) => {
  const row = [];
  row.push(`public class ${ast.identify} {`);
  for (const item of ast.content.body) {
    if (item.type === "VariableDeclaration") {
      row.push(
        ` public ${formatMap.get(item.format) ?? item.format}${
          item.repeated ? "[]" : ""
        }${item.optional ? "?" : ""} ${item.identify} { get; set; }`
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
  const val = `${formatMap.get(format.format) ?? format.format}${
    format.repeated ? "[]" : ""
  }${format.optional ? "?" : ""}`;
  return val === "void" ? "void" : `ActionResult<${val}>`;
};

export const generateArgumentsType = (
  args: FunctionArgumentsNode,
  funcName: string,
  serviceIdentify: string
) => {
  // 请求的参数是否为空
  let isVoid = true;
  // c#使用类获取参数时不能细分到字段，这里再自动生成一个Request类
  const row: string[] = [];
  const className = funcName + "Request";
  row.push(`public class ${className} {`);
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      isVoid = false;
      row.push(
        `public ${formatMap.get(item.format) ?? item.format}${
          item.repeated ? "[]" : ""
        }${item.optional ? "?" : ""} ${item.identify} { get; set; }`
      );
    }
  }
  row.push("}");
  if (isVoid) {
    return "";
  }
  requestDefineStack.push(row.join("\n"));
  return serviceIdentify + "ControllerDefinition." + className + " req";
};

const generateFunction = (
  func: FunctionDeclarationNode,
  serviceIdentify: string
) => {
  const resp = responseType(func.returnType);
  const args = generateArgumentsType(
    func.arguments,
    func.identify,
    serviceIdentify
  );
  return `public ${resp} ${func.identify}(${args});`;
};

const generateService = (service: ServiceDeclarationNode) => {
  const row = [];
  row.push(`public interface Unimpled${service.identify}Controller {`);
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
  row.push(`public static class ${service.identify}ControllerDefinition {`);
  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      const name = item.identify
        .replace(/([A-Z])/g, (a: string, b: string) => "_" + b.toLowerCase())
        .substring(1)
        .toUpperCase();
      const methodName = item.identify.replace(item.method, "");
      row.push(
        `public const string ${name}_PATH = "${service.identify}.${methodName}";`
      );
    }
  }

  row.push("/* 接口参数类型生成 */");
  while (requestDefineStack.length) {
    row.push(requestDefineStack.pop());
  }

  row.push("}");
  return row.join("\n");
};

const ServerGenerator = (program: ProgramNode) => {
  let content = staticComment + "\n";
  content += `using Microsoft.AspNetCore.Mvc;\n`;
  content += `using OmiServer;\n`;

  content += `namespace OmiServer;\n`;

  for (const item of program.body) {
    if (item.type === "StructDeclaration") {
      content += generateStruct(item) + "\n";
    }
    if (item.type === "ServiceDeclaration") {
      content += generateService(item) + "\n";
      content += generateDefinition(item) + "\n";
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
  }
  return content;
};

export default ServerGenerator;
