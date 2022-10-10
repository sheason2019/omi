const formatMap = new Map<string, string>();
formatMap.set("int", "int");
formatMap.set("double", "float64");
formatMap.set("float", "float32");
formatMap.set("string", "string");
formatMap.set("boolean", "bool");
formatMap.set("void", "");

export const setFormatFlag = (format: string) => {
  return `%{format:${format}}%`;
};
export const parseFormatFlag = (content: string) => {
  return content.replaceAll(/%\{format:(\w+)\}%/g, (match, identify) => {
    return formatMap.get(identify) ?? identify;
  });
};

export default formatMap;
