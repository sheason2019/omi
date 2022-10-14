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

const ClientGenerator = (program: ProgramNode, commonjs: boolean): string => {
  let hasService = false;

  const row: string[] = [];
  // 添加固定导入内容
  row.push(staticComment);
  row.push("");
  row.push(NET_WORK_FLAG);
  row.push("");
  for (const item of program.body) {
    if (item.type === "ImportDeclaration") {
      row.push(generateImport(item, "client"));
    }
    if (item.type === "StructDeclaration") {
      row.push(generateStruct(item));
    }
    if (item.type === "ServiceDeclaration") {
      row.push(generateService(item));
      hasService = true;
    }
    if (item.type === "EnumDeclaration") {
      row.push(generateEnum(item));
    }
    if (item.type === "Comments") {
      row.push(item.content);
    }
  }

  let content = row.join("\n");

  const requirePath =
    "@omi-stack/omi-client" + (commonjs ? "/dist/commonjs" : "");

  if (hasService) {
    const row: string[] = [];
    row.push(`import { OmiClientBase } from '${requirePath}';`);
    row.push(`import { AxiosRequestConfig } from "axios";`);
    const netImport = row.join("\n");
    content = content.replace(NET_WORK_FLAG, netImport);
  } else {
    content = content.replace(NET_WORK_FLAG, "");
  }

  return prettier.format(content, { parser: "typescript" });
};

// 根据IDL文件是否生成Service接口确定是否需要引入axios
const NET_WORK_FLAG = "<%NET_WORK_FLAG%>";

export default ClientGenerator;
