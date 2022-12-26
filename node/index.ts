import { execFile } from "node:child_process";

const args = process.argv.slice(2);
console.log(args);

execFile("./omi", args, (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  if (stdout) {
    console.log("STDOUT::\n" + stdout);
    return;
  }
  console.log("STDERR::\n", stderr);
});
