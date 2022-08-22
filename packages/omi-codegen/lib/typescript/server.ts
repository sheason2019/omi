import {
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  ProgramNode,
  FunctionArgumentsNode,
} from "@omi-stack/omi-ast-parser";
import prettier from "prettier";
import upperSnackMethodName from "../common/utils/upper-snack-method-name";
import {
  generateImport,
  generateStruct,
  responseType,
  staticComment,
} from "./common";
import formatMap from "./format-map";

export const generateArgumentsType = (args: FunctionArgumentsNode) => {
  const formats: string[] = [];

  for (const item of args.body) {
    if (item.type === "VariableDeclaration") {
      formats.push(
        `${item.identify}: ${formatMap.get(item.format) ?? item.format}${
          item.repeated ? "[]" : ""
        }${item.optional ? "?" : ""}`
      );
    }
  }

  return formats.join(",");
};

const generateFunction = (func: FunctionDeclarationNode) => {
  const resp = responseType(func.returnType);
  const args = generateArgumentsType(func.arguments);
  return `${func.identify}(${args}): Promise<${resp}> | ${resp};`;
};

const generateService = (ast: ServiceDeclarationNode): string => {
  const row = [];
  row.push(`export interface Unimpled${ast.identify}Controller {`);
  for (const item of ast.content.body) {
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

const generateDefinition = (ast: ServiceDeclarationNode): string => {
  const row: string[] = [];
  row.push(`export const ${ast.identify}ControllerDefinition = {`);
  for (const item of ast.content.body) {
    if (item.type === "FunctionDeclaration") {
      const name = upperSnackMethodName(item.identify) + "_PATH";
      const methodName = item.identify.replace(item.method, "");
      row.push(`${name}: '${ast.identify}.${methodName}',`);
    }
  }
  row.push("} as const;");
  return row.join("\n");
};

const ServerGenerator = (program: ProgramNode): string => {
  let content = ``;
  content += staticComment;
  content += "\n";
  for (const item of program.body) {
    if (item.type === "ImportDeclaration") {
      content += generateImport(item, "server") + "\n";
    }
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
  return prettier.format(content, { parser: "typescript" });
};

export default ServerGenerator;
