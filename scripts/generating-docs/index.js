/**
 * Script for cleaning the project from temporary files and building a new bundle
 * 1- Deleting some directories and files
 * 2- Installing dependencies
 * 3- Build a new bundle
 */

const fs = require("fs");
const util = require("util");
const childProcess = require("child_process");
const exec = util.promisify(childProcess.exec);
const proc = require("process");
const readline = require("readline");
const rl = readline.createInterface({
  input: proc.stdin,
  output: proc.stdout,
});
const question = util.promisify(rl.question).bind(rl);
const { exit } = require("process");

async function execute(command) {
  console.log(command);
  const response = await exec(command);
  if (response.error != null) {
    throw new Error(response.error);
  }
  if (response.stderr != null && response.stderr !== "") {
    console.error(response.stderr);
  }
  if (response.stdout != null && response.stdout !== "") {
    console.log(response.stdout);
  }
  return response;
}

async function getPackageJson(settings) {
  console.log("==>>> Opening package.json file...");
  const packageJson = await fs.readFileSync(settings.packagePath, "utf8");
  const packageObject = JSON.parse(packageJson);
  if (packageObject != null) {
    console.log(`**** The current version is ${packageObject.version}`);
    return packageObject.version;
  }
  return "";
}

async function getNewVersion() {
  console.log("==>>> Checking the new version provided...");
  let newVersion;
  const versionIndex = proc.argv.findIndex(function (argv) {
    return argv.includes("--np-new-version=");
  });
  if (versionIndex > -1) {
    const versionArg = proc.argv[versionIndex].split("--np-new-version=");
    newVersion =
      versionArg[1] == null || versionArg[1] === "" ? undefined : versionArg[1];
  }
  if (newVersion == null) {
    newVersion = await question("No version provided. Type the new version: ");
  }
  console.log("**** Version to publish: " + newVersion);
  return newVersion;
}

async function startGeneratingDocs(settings) {
  console.log("==>>> Starting the Docs generation");

  await generatingDocument(settings);
  await changingVersion(settings);
  await pushingChanges(settings);
}

async function generatingDocument(_settings) {
  console.log("==>>> Generating Document...");
  await execute("npm run compodoc");
}

async function changingVersion(settings) {
  console.log("==>>> Replacing the old version in the document");
  const doc = await fs.readFileSync(settings.docsPath, "utf8");
  const replacedDoc = doc.replace(settings.currentVersion, settings.newVersion);
  await fs.writeFileSync(settings.docsPath, replacedDoc, "utf8");
}

async function pushingChanges(settings) {
  console.log("==>>> Commiting and Pushing Docs changes...");

  const gitStatus = await execute("git status -s");
  console.log("gitStatus", gitStatus);
  if (gitStatus.stdout !== "") {
    const gitStdout = await execute("git rev-parse --abbrev-ref HEAD");
    console.log("gitStdout", gitStdout);
    await execute(`git add ${settings.docsPath}`);
    await execute(
      `git commit --no-verify -m "📝 docs: Updated docs${
        settings.newVersion != null || settings.newVersion !== ""
          ? " for " + settings.newVersion
          : ""
      }"`
    );
    await execute(`git push -u origin ${gitStdout.stdout}`);
  } else {
    console.log("Nothing to Push");
  }
}

async function revertChanges(settings) {
  console.log(">>> Checking for modifications...");
  console.warn(
    `>>> Unstaging posible changes from ${settings.docsFileName} and ${settings.packageFileName} file`
  );
  await execute(
    `git restore --staged ${settings.docsPath} ${settings.packagePath}`
  );
  console.warn(
    `>>> Discarting posible changes of ${settings.docsFileName} and ${settings.packageFileName} file`
  );
  await execute(`git checkout -- ${settings.docsPath} ${settings.packagePath}`);
}

async function init() {
  console.log("Generating Docs execution.");
  let settings = {
    currentVersion: "",
    docsPath: "./README.md",
    docsFileName: "README.md",
    newVersion: undefined,
    packageFileName: "package.json",
    packagePath: "./package.json",
  };

  try {
    settings["currentVersion"] = await getPackageJson(settings);
    settings["newVersion"] = await getNewVersion();

    await startGeneratingDocs(settings);
    console.info("Docs were generated.");
  } catch (err) {
    console.error("Error: ", err);
    await revertChanges(settings);
  } finally {
    console.log("Execution finished");
    exit();
  }
}

init();
