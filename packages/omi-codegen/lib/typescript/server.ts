import prettier from "prettier";
import {
  AST,
  FunctionTree,
  ServiceTree,
  StructTree,
  VariableTree,
} from "omi-ast-parser";
import formatMap from "./format-map";

const generateStruct = (ast: StructTree): string => {
  const row = [];
  row.push(`interface ${ast.name} {`);
  for (const item of ast.items) {
    row.push(`  ${item.name}: ${formatMap.get(item.format) ?? item.format};`);
  }
  row.push("}");
  return row.join("\n");
};

const generateArgumentsType = (asts: VariableTree[]) => {
  const row = [];
  row.push("{");
  for (const item of asts) {
    row.push(`  ${item.name}: ${formatMap.get(item.format) ?? item.format};`);
  }
  row.push("}");
  return row.join("");
};

const generateFunction = (ast: FunctionTree) => {
  return `abstract ${ast.name}: OmiLambda<${generateArgumentsType(
    ast.requestArguments
  )}, ${formatMap.get(ast.responseType) ?? ast.responseType}>;`;
};

const generateService = (ast: ServiceTree): string => {
  const row = [];
  row.push(`abstract class Unimpled${ast.name}Controller {`);
  row.push(`  namespace: string = "${ast.name}";`);
  for (const funcTree of ast.items) {
    row.push(generateFunction(funcTree));
  }
  row.push("}");
  return row.join("\n");
};

const ServerGenerator = (ast: AST[]): string => {
  const content: string[] = [];
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
