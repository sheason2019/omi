#!/usr/bin/env node

import { program } from "commander";
import OmiCodegen from "./index";

const allowLang = ["typescript", "ts", "csharp", "cs"];

program
  .option("-o, -out <out>", "codegen outDir")
  .option(
    "-t, -codegenTarget <codegenTarget>",
    "codegen platform type, client or server or both"
  )
  .option(
    "-l, -language <language>",
    `use "omi-codegen -allowLang" check all language support`
  )
  .option("-allowLang", "check allow language");

const action = () => {
  program.parse();

  const options = program.opts();

  const codegen = new OmiCodegen();

  // 如果用户指定
  const isAllowLang: boolean = options.AllowLang;
  if (isAllowLang) {
    console.log(
      "all allow language: \n" + allowLang.map((lang) => "- " + lang).join("\n")
    );
    return;
  }

  const outDir = options.Out;
  const lang = options.Language;
  const target = options.CodegenTarget;
  const fileOrPath = program.args.length ? program.args[0] : undefined;

  // 如果没有输入路径参数，展示帮助信息并退出CLI
  if (!fileOrPath) {
    program.help();
  }

  // 正常Codegen流程
  codegen.parse(fileOrPath);
  if (target !== "client" && target !== "server" && target !== "both") {
    console.error(`-t 参数必须为 "client"、"server"或"both"`);
    return;
  }
  if (!outDir) {
    console.error("必须指定生成代码的输出位置，-o 参数不能为空");
    return;
  }
  if (lang === "typescript" || lang === "ts") {
    codegen.toTypescript(target, outDir);
  } else if (lang === "cs" || lang === "csharp") {
    codegen.toCSharp(target, outDir);
  } else if (allowLang.indexOf(lang) === -1) {
    console.error(`当前允许的语言类型仅有：${allowLang}`);
    return;
  }
};

action();
