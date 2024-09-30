#! /usr/bin/env node

// import chalk from "chalk";
// import figlet from "figlet";
import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import inquirer from "inquirer";
import download from "download-git-repo";
import ora from "ora";

/** 删除用不上的模版 */
const cleanUpTemplates = (selectedTemplateName, targetPath) => {
  const templatesDir = path.join(targetPath, "./");
  const templates = fs.readdirSync(templatesDir);
  templates.forEach((template) => {
    if (template.startsWith("template-")) {
      const templatePath = path.join(templatesDir, template);
      // 删除模版文件
      fs.removeSync(templatePath);
    }
  });
};

/** 下载远程模版 */
const downloadTemplate = async (targetPath, templateName) => {
  const spinner = ora("远端仓库开始下载...");
  spinner.start();
  // 下载远端模版
  download(
    // 远端模版仓库地址
    "direct:https://github.com/bluwy/create-vite-extra.git",
    targetPath,
    {
      clone: true,
    },
    (err) => {
      if (err) {
        spinner.fail("[ 远端仓库下载失败 ]");
      } else {
        spinner.succeed("[ 远端仓库下载成功 ]");
        copyTemplateFiles(path.join(targetPath, templateName), targetPath);
        cleanUpTemplates(templateName, targetPath);
      }
    }
  );
};

/** 筛选出想要的那个模版 */
const copyTemplateFiles = (templateDir, targetPath) => {
  const files = fs.readdirSync(templateDir);
  files.forEach((file) => {
    const sourcePath = path.join(templateDir, file);
    const targetFilePath = path.join(targetPath, file);
    if (fs.statSync(sourcePath).isDirectory()) {
      fs.copySync(sourcePath, targetFilePath);
    } else {
      fs.writeFileSync(targetFilePath, fs.readFileSync(sourcePath));
    }
  });
};

/** 选择想使用的代码模版 */
const selectTemplate = async (targetPath) => {
  const templates = [
    "template-ssr-vue-ts",
    "template-ssr-vue",
    "template-library-ts",
    "template-library",
  ]; // 你的模板列表
  const { templateName } = await inquirer.prompt([
    {
      type: "list",
      name: "templateName",
      message: "请选择一个模板",
      choices: templates,
    },
  ]);
  await downloadTemplate(targetPath, templateName);
};

/** 自定义脚手架命令 */
const program = new Command();
program.name("naruto").description("这里是描述文案").version("1.0.0");
program
  .command("create <name>")
  .description("创建一个新工程")
  .action(async (name) => {
    console.log("[工程名称] > ", name);
    // 当前命令行执行的目录
    const cwd = process.cwd();
    // 需要创建的目录
    const targetPath = path.join(cwd, name);
    // 目录是否存在
    if (fs.existsSync(targetPath)) {
      const answers = await inquirer.prompt([
        {
          type: "confirm",
          name: "force",
          message: `目录 ${name} 已存在，是否覆盖?`,
          default: false,
        },
      ]);
      if (answers.force) {
        // 强制创建
        fs.removeSync(targetPath);
        await selectTemplate(targetPath, name);
        console.log(`目录 ${name} 已覆盖创建.`);
      } else {
        console.log(`操作已取消.`);
      }
    } else {
      // 目录不存在正常创建
      await selectTemplate(targetPath, name);
    }
  });
program.parse(process.argv);

// console.log(
//   "\r\n" +
//     chalk.white.bgBlueBright.bold(
//       figlet.textSync("naruto-cli", {
//         font: "Standard",
//         horizontalLayout: "default",
//         verticalLayout: "default",
//         width: 80,
//         whitespaceBreak: true,
//       })
//     )
// );
