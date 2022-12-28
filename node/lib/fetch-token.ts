import { execFile } from "child_process";
import { ITokenOutput } from "./typings";

/**
 * 根据路径获取文件并解析出Token
 */
export const fetchToken = (path: string): Promise<ITokenOutput | null> => {
  return new Promise<ITokenOutput | null>((resolve) => {
    execFile(
      "../bin/omi",
      ["--file", path, "--token"],
      (err, stdout, stderr) => {
        if (err) resolve(null);

        resolve(JSON.parse(stdout));
      }
    );
    resolve(null);
  });
};
