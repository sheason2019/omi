import { execFile } from "child_process";
import { IOutputContainer } from "./typings";

/**
 * 根据路径获取文件并解析出Token
 */
export const fetchToken = (
  path: string,
  content: string
): Promise<IOutputContainer> => {
  return new Promise<IOutputContainer>((resolve) => {
    try {
      execFile(
        "omi",
        ["--filePath", path, "--fileContent", content, "--token"],
        (err, stdout, stderr) => {
          console.log(err, stderr);
          resolve(JSON.parse(stdout));
        }
      );
    } catch (e) {
      console.log(e);
    }
  });
};
