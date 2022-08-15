import {
  FunctionDeclarationNode,
  ServiceDeclarationNode,
  ProgramNode,
} from "@omi-stack/omi-ast-parser";
import prettier from "prettier";
import {
  generateArgumentsType,
  generateImport,
  generateStruct,
  responseType,
  staticComment,
} from "./common";

const generateFunction = (func: FunctionDeclarationNode) => {
  const resp = responseType(func.returnType);
  const args = generateArgumentsType(func.arguments);
  return `abstract ${func.identify}({ props }: OmiServerCtx<${args}>): Promise<${resp}> | ${resp};`;
};

const generateService = (ast: ServiceDeclarationNode): string => {
  const row = [];
  row.push(`export abstract class Unimpled${ast.identify}Controller {`);
  row.push(`  namespace: string = "${ast.identify}";`);
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

const ServerGenerator = (program: ProgramNode): string => {
  let content = ``;
  content += staticComment;
  content += "\n";
  content += `import { OmiServerCtx } from '@omi-stack/omi-server';`;
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
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
  }
  return prettier.format(content, { parser: "typescript" });
};

export default ServerGenerator;
