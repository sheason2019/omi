interface IGlobalFormatItem {
  map: Map<string, string>;
  packageName: string;
}
const globalFormatMap = new Map<string, IGlobalFormatItem>();

export const getGoFormatMap = (
  fileMd5: string,
  packageName: string
): Map<string, string> => {
  if (globalFormatMap.has(fileMd5)) {
    return globalFormatMap.get(fileMd5)!.map;
  }

  const formatMap = new Map<string, string>();
  formatMap.set("int", "int");
  formatMap.set("double", "float64");
  formatMap.set("float", "float32");
  formatMap.set("string", "string");
  formatMap.set("boolean", "bool");
  formatMap.set("void", "");

  globalFormatMap.set(fileMd5, { map: formatMap, packageName });

  return formatMap;
};

export const setFormatFlag = (format: string, fileMd5: string) => {
  return `%{format:${fileMd5}:${format}}%`;
};

export const parseFormatFlag = (content: string, fromMd5: string): string => {
  return content.replaceAll(
    /%\{format:(\w+):(\w+)\}%/g,
    (match, fileMd5, identify) => {
      const { map, packageName } = globalFormatMap.get(fileMd5)!;
      const storagedFormat = map.get(identify);
      if (storagedFormat !== undefined) {
        return storagedFormat;
      }

      // 同文件直接返回identify
      if (fileMd5 === fromMd5) {
        return identify;
      }
      // 不同文件返回包名 + identify
      return `${packageName}.${identify}`;
    }
  );
};

export const handleSetFormatFlag = (
  format: string,
  md5: string,
  importFormatMap: Map<string, string>,
  importUsedMap: Map<string, boolean>
) => {
  let inputMd5: string;
  if (importFormatMap.has(format)) {
    inputMd5 = importFormatMap.get(format)!;
    importUsedMap.set(inputMd5, true);
  } else {
    inputMd5 = md5;
  }

  return setFormatFlag(format, inputMd5);
};

export default globalFormatMap;
