import { parseFormatFlag } from "./format-map";
import { parseImportFlag } from "./import";
import { parsePackageFlag } from "./package";

// 产物后处理
const suffixDeal = (
  content: string,
  pkgName: string,
  fromMd5: string,
  packageRoot: string
) => {
  // 置换类型
  content = parseFormatFlag(content, fromMd5);
  // 置换包名
  content = parsePackageFlag(content, pkgName);
  // 置换import语句
  content = parseImportFlag(content, packageRoot);

  return content;
};

export default suffixDeal;
