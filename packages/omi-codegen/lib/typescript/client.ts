import prettier from "prettier";
import { AST, FunctionTree, ServiceTree } from "omi-ast-parser";
import {
  generateArgumentsType,
  generateStruct,
  responseType,
  staticComment,
} from "./common";

const generateFunction = (ast: FunctionTree, namespace: string) => {
  return ` ${ast.name}(props: ${generateArgumentsType(
    ast.requestArguments
  )}, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "${namespace}.${ast.name.replace(ast.method, "")}";
    const method = "${ast.method}";
    return this.request<${responseType(
      ast.response
    )}>(url, method, props, option);
  }`;
};

const generateService = (ast: ServiceTree) => {
  const row = [];
  row.push(`export class ${ast.name}Client extends OmiClientBase {`);
  for (const funcTree of ast.items) {
    row.push(generateFunction(funcTree, ast.name));
  }
  row.push("}");
  return row.join("\n");
};

const ClientGenerator = (ast: AST[]): string => {
  const content: string[] = [];
  // 添加固定导入内容
  content.push(staticComment);
  content.push("");
  content.push(`import { OmiClientBase } from 'omi-client';`);
  content.push(`import { AxiosRequestConfig } from "axios";`);
  content.push("");
  for (const item of ast) {
    if (item.type === "struct") {
      content.push(generateStruct(item));
    }
    if (item.type === "service") {
      content.push(generateService(item));
    }
  }
  return prettier.format(content.join("\n"), { parser: "typescript" });
};

export default ClientGenerator;
