import {
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  ProgramNode,
} from "@omi-stack/omi-ast-parser";
import prettier from "prettier";
import {
  generateArgumentsType,
  generateEnum,
  generateImport,
  generateStruct,
  responseType,
  staticComment,
} from "./common";

const generateFunction = (func: FunctionDeclarationNode, namespace: string) => {
  return ` ${func.identify}(props: ${generateArgumentsType(
    func.arguments
  )}, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "${namespace}.${func.identify.replace(func.method, "")}";
    const method = "${func.method}";
    return this.request<${responseType(
      func.returnType
    )}>(url, method, props, option);
  }`;
};

const generateService = (service: ServiceDeclarationNode) => {
  const row = [];
  row.push(`export class ${service.identify}Client extends OmiClientBase {`);
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

const ClientGenerator = (program: ProgramNode): string => {
  const content: string[] = [];
  // 添加固定导入内容
  content.push(staticComment);
  content.push("");
  content.push(`import { OmiClientBase } from '@omi-stack/omi-client';`);
  content.push(`import { AxiosRequestConfig } from "axios";`);
  content.push("");
  for (const item of program.body) {
    if (item.type === "ImportDeclaration") {
      content.push(generateImport(item, "client"));
    }
    if (item.type === "StructDeclaration") {
      content.push(generateStruct(item));
    }
    if (item.type === "ServiceDeclaration") {
      content.push(generateService(item));
    }
    if (item.type === "EnumDeclaration") {
      content.push(generateEnum(item));
    }
    if (item.type === "Comments") {
      content.push(item.content);
    }
  }
  return prettier.format(content.join("\n"), { parser: "typescript" });
};

export default ClientGenerator;
