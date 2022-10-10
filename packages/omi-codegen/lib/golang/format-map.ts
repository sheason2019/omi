const globalFormatMap = new Map<string, Map<string, string>>();

export const getGoFormatMap = (fileMd5: string): Map<string, string> => {
  if (globalFormatMap.has(fileMd5)) {
    return globalFormatMap.get(fileMd5) as Map<string, string>;
  }

  const formatMap = new Map<string, string>();
  formatMap.set("int", "int");
  formatMap.set("double", "float64");
  formatMap.set("float", "float32");
  formatMap.set("string", "string");
  formatMap.set("boolean", "bool");
  formatMap.set("void", "");

  globalFormatMap.set(fileMd5, formatMap);

  return formatMap;
};

export const setFormatFlag = (format: string, fileMd5: string) => {
  return `%{format:${fileMd5}:${format}}%`;
};
export const parseFormatFlag = (content: string) => {
  return content.replaceAll(
    /%\{format:(\w+):(\w+)\}%/g,
    (match, fileMd5, identify) => {
      return globalFormatMap.get(fileMd5)?.get(identify) ?? identify;
    }
  );
};

export default globalFormatMap;
