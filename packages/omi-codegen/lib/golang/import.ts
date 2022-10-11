import globalFormatMap from "./format-map";

export const setImportFlag = (fileMd5: string) => {
  return `%{import:${fileMd5}}%`;
};

/**
 * 检测文件是否有使用import的内容，若没有则不添加import语句
 * @param used 文件是否使用了import的内容
 */
export const updateImportFlag = (
  content: string,
  map: Map<string, boolean>
) => {
  return content.replaceAll(/%\{import:(\w+)\}%/g, (match, fileMd5) => {
    return map.get(fileMd5) ? match : "";
  });
};

export const parseImportFlag = (content: string, packageRoot: string) => {
  return content.replaceAll(/%\{import:(\w+)\}%/g, (match, fileMd5) => {
    const { packageName } = globalFormatMap.get(fileMd5)!;

    return `import ${packageName} "${packageRoot}/${packageName}"\n`;
  });
};
