import { FormatMapValue } from "./typings";

export const initFormatMap = () => {
  const map = new Map<string, FormatMapValue>();

  // 添加基础format类型
  ["int", "double", "string", "void", "boolean", "float"].forEach((type) => {
    map.set(type, { origin: "basic" });
  });
  return map;
};
