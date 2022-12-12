import * as fs from "fs";

export const createTimeStampFile = (path: string) => {
  fs.writeFileSync(path + "/omi-log", generateContent());
};

const generateContent = () => {
  return `Code generate by omi-idl.

Last update time is: ${timeStr()}`;
};

const timeStr = () => {
  const time = new Date();
  return (
    time.getFullYear() +
    "年" +
    (time.getMonth() + 1) +
    "月" +
    time.getDate() +
    "日 " +
    time.getHours().toString().padStart(2, "0") +
    ":" +
    time.getMinutes().toString().padStart(2, "0") +
    ":" +
    time.getSeconds().toString().padStart(2, "0")
  );
};
