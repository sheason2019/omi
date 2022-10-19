import {
  FunctionArgumentsNode,
  FunctionDeclarationNode,
  ProgramNode,
  ServiceDeclarationNode,
} from "@omi-stack/omi-ast-parser";
import { staticComment } from "../typescript/common";
import { firstLetterUppercase, handleImport } from "./common";
import { handleSetFormatFlag, setFormatFlag } from "./format-map";
import { updateImportFlag } from "./import";
import { setPackageFlag } from "./package";

const STATIC_IMPORT_SLOT = "[%STATIC_IMPORT SLOT%]";
let md5: string;
let importFormatMap: Map<string, string>;
let importUsedMap: Map<string, boolean>;
let useFmt: boolean;

// 生成结构体定义
const generateService = (service: ServiceDeclarationNode) => {
  const row = [];
  row.push(`type ${service.identify}Client struct {`);
  row.push("Request *req.Client");
  row.push("HOST string");
  row.push("}");
  return row.join("\n");
};

// 生成初始化函数定义
const generateNewFunction = (service: ServiceDeclarationNode) => {
  const structName = service.identify + "Client";
  const row = [];
  row.push(
    `func (${structName}) New(host string) (definition ${structName}) {`
  );
  row.push("definition.HOST = host");
  row.push("return");
  row.push("}");
  return row.join("\n");
};

// 构造一个GetRequestClient的方法，将请求对象暴露出来，方便添加服务鉴权等功能
const generateGetRequestClient = (service: ServiceDeclarationNode) => {
  const structName = service.identify + "Client";
  const row = [];
  row.push(`func (definition ${structName}) GetRequestClient() *req.Client {`);
  row.push("if definition.Request != nil {");
  row.push("return definition.Request");
  row.push("}");
  row.push("return req.C()");
  row.push("}");

  return row.join("\n");
};

// 构造service中的所有请求方法
const generateMethodGroup = (service: ServiceDeclarationNode) => {
  const structName = service.identify + "Client";
  const row = [];

  for (const item of service.content.body) {
    if (item.type === "FunctionDeclaration") {
      const methodName = item.identify.replace(item.method, "");
      const path = `"/${service.identify}.${methodName}"`;
      row.push(generateMethod(item, structName, path));
    }
  }

  return row.join("\n");
};

// 构造单个请求方法
const generateMethod = (
  node: FunctionDeclarationNode,
  structName: string,
  path: string
) => {
  const row = [];

  const isVoid = node.returnType.format === "void";

  const returnStr = isVoid
    ? ""
    : `(result ${node.returnType.repeated ? "[]" : ""}${handleSetFormatFlag(
        node.returnType.format,
        md5,
        importFormatMap,
        importUsedMap
      )})`;

  const setResultStr = isVoid ? "" : ".SetResult(&result)";

  // 方法的参数
  const args = generateArgumentsType(node.arguments);

  // 将传入的参数附加到请求中
  const params = generateRequestParams(node.arguments, node);

  const pathWithHost = "definition.HOST + " + path;

  row.push(
    `func (definition ${structName}) ${node.identify}(${args}) ${returnStr} {`
  );
  row.push(`client := definition.GetRequestClient()`);
  row.push(
    `resp, err := client.R()${params}${setResultStr}.${node.method}(${pathWithHost})`
  );

  row.push("if err != nil {");
  row.push("panic(err)");
  row.push("}");

  row.push("if resp.IsError() {");
  row.push(`panic("远程调用错误")`);
  row.push("}");

  row.push("return");
  row.push("}\n");

  return row.join("\n");
};

const generateRequestParams = (
  args: FunctionArgumentsNode,
  func: FunctionDeclarationNode
) => {
  let content = "";
  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      if (func.method === "Get" || func.method === "Delete") {
        useFmt = true;
        content += `.SetQueryParam("${item.identify}", fmt.Sprint(${item.identify}))`;
      } else {
        const args: string[] = [];
        func.arguments.body.forEach((item) => {
          if (item.type === "VariableDeclaration") {
            args.push(
              `${firstLetterUppercase(item.identify)}: ${item.identify}`
            );
          }
        });
        const argsStr = args.join(",");
        content += `.SetBody(&${func.identify}Request{${argsStr}})`;
      }
    }
  }

  return content;
};

const generateArgumentsType = (args: FunctionArgumentsNode) => {
  const format: string[] = [];
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

const staticImport = () => {
  return `import (
    ${useFmt ? '"fmt"' : ""}

    "github.com/imroc/req/v3"
  )`;
};

const GolangClientGenerator = (
  program: ProgramNode,
  fileMd5: string,
  rootDir: string
) => {
  md5 = fileMd5;
  importFormatMap = new Map();
  importUsedMap = new Map();
  useFmt = false;

  let hasContent = false;

  let content = staticComment + "\n";

  content += setPackageFlag() + "\n";

  content += STATIC_IMPORT_SLOT + "\n";

  for (const item of program.body) {
    if (item.type === "ImportDeclaration") {
      content += handleImport(item, rootDir, importFormatMap);
    }
    if (item.type === "ServiceDeclaration") {
      content += generateService(item) + "\n";
      content += generateNewFunction(item) + "\n";
      content += generateGetRequestClient(item) + "\n";
      content += generateMethodGroup(item) + "\n";
      hasContent = true;
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

export default GolangClientGenerator;
