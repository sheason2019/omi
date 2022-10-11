const PACKAGE_FLAG = `%{package}%`;

export const setPackageFlag = () => PACKAGE_FLAG;

export const parsePackageFlag = (content: string, pkgName: string) => {
  return content.replace(PACKAGE_FLAG, `package ${pkgName}`);
};
