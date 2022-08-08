import prettier from "prettier";
import { AST, FunctionTree, ServiceTree } from "omi-ast-parser";
import {
  generateArgumentsType,
  generateStruct,
  responseType,
  staticComment,
} from "./common";

const generateFunction = (ast: FunctionTree) => {
  const lambdaType = `OmiLambda<${generateArgumentsType(
    ast.requestArguments
  )}, ${responseType(ast.response)}>`;
  return `abstract ${ast.name}(...args: Parameters<${lambdaType}>): ReturnType<${lambdaType}>;`;
};

const generateService = (ast: ServiceTree): string => {
  const row = [];
  row.push(`export abstract class Unimpled${ast.name}Controller {`);
  row.push(`  namespace: string = "${ast.name}";`);
  for (const funcTree of ast.items) {
    row.push(generateFunction(funcTree));
  }
  row.push("}");
  return row.join("\n");
};

const ServerGenerator = (ast: AST[]): string => {
  const content: string[] = [];
  content.push(staticComment);
  content.push("");
  content.push(`import { OmiLambda } from 'omi-server';`);
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

export default ServerGenerator;
