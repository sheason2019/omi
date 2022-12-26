import { execFile } from "node:child_process";
import { IOutputContainer } from "./typings";

const args = process.argv.slice(2);

execFile("./omi", args, (err, stdout, stderr) => {
  const action: IOutputContainer = JSON.parse(stdout);

  
  if (stdout) {
    console.log("STDOUT::\n" + stdout);
    return;
  }
  console.log("STDERR::\n", stderr);
});
