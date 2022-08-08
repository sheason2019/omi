import { StructTree, VariableTree } from "omi-ast-parser";
import formatMap from "./format-map";

export const generateStruct = (ast: StructTree): string => {
  const row = [];
  row.push(`export interface ${ast.name} {`);
  for (const item of ast.items) {
    row.push(
      `  ${item.name}${item.repeated ? "[]" : ""}: ${
        formatMap.get(item.format) ?? item.format
      };`
    );
  }
  row.push("}");
  return row.join("\n");
};

export const generateArgumentsType = (asts: VariableTree[]) => {
  const row = [];
  row.push("{");
  for (const item of asts) {
    row.push(
      `  ${item.name}: ${formatMap.get(item.format) ?? item.format}${
        item.repeated ? "[]" : ""
      };`
    );
  }
  row.push("}");
  return row.join("");
};

const timeStr = () => {
  const time = new Date();
  return (
    time.getFullYear() +
    "年" +
    (time.getMonth() + 1) +
    "月" +
    time.getDate() +
    "日 " +
    time.getHours() +
    ":" +
    time.getMinutes() +
    ":" +
    time.getSeconds()
  );
};

export const staticComment = `/**
* 本文件由Omi.js自动生成，请勿随意改动
* 生成时间：${timeStr()}.
*/`;

export const responseType = (response: VariableTree) => {
  const val = `${formatMap.get(response.format) ?? response.format}${
    response.repeated ? "[]" : ""
  }`;
  return val;
};
