import {
  EnumContentNode,
  EnumDeclarationNode,
  FormatNode,
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  Method,
  ProgramNode,
  ServiceDeclarationNode,
  StructDeclarationNode,
} from "@omi-stack/omi-ast-parser";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
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
  serviceIdentify: string,
  method: Method
) => {
  // 这里需要分两种情况来生成请求的参数

  // 当请求类型为Post或Put时，自动生成聚合类型从请求体中获取请求值
  if (["Post", "Put"].indexOf(method) !== -1) {
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
  }

  // 其余的请求类型直接把请求参数写入函数体中，让ASP.NET去自动获取
  const format: string[] = [];
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      format.push(
        `${formatMap.get(item.format) ?? item.format}${
          item.repeated ? "[]" : ""
        }${item.optional ? "?" : ""} ${item.identify}`
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
  const args = generateArgumentsType(
    func.arguments,
    func.identify,
    serviceIdentify,
    func.method
  );
  return `${resp} ${func.identify}(${args});`;
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
      const name = upperSnackMethodName(item.identify) + "_PATH";
      const methodName = item.identify.replace(item.method, "");
      row.push(
        `public const string ${name} = "${service.identify}.${methodName}";`
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
  return `enum ${ast.identify} {
    ${generateEnumContent(ast.content)}
  }`;
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
    if (item.type === "EnumDeclaration") {
      content += generateEnum(item) + "\n";
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
  }
  return content;
};

export default ServerGenerator;
