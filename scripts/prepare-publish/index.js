const util = require("util");
const exec = util.promisify(require("child_process").exec);
const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const execute = async (command, summary) => {
  console.log(summary || command);
  const { stdout, stderr } = await exec(command);
  console.log(stdout);
  console.error(stderr);
};

const changeDocsVersion = (oldVersion, newVersion) => {
  fs.readFile("README.md", "utf8", function (rErr, rData) {
    if (rErr) return console.log(rErr);
    let result = rData.replace(oldVersion, newVersion);
    fs.writeFile("README.md", result, "utf8", function (rErr2) {
      if (rErr2) return console.log(rErr2);
    });
  });
};

function init() {
  fs.readFile("package.json", "utf8", function (pErr, pData) {
    if (pErr) return console.log(pErr);

    const oldVersion = JSON.parse(pData).version;

    rl.question(
      `Type the new version (current is ${oldVersion}): `,
      async function (version) {
        console.log(`The new version will be: ${version}`);
        const newVersion = version;

        await execute(
          "rm -f package-lock.json && rm -f -R node_modules/ && rm -f -R dist/",
          "-> Cleaning project..."
        );
        await execute("npm install", "-> Installing Dependencies...");
        await execute("npm run build", "-> Generating Build...");
        await execute(
          "doxdox 'dist/**/*.js' --layout markdown --output README.md --ignore 'dist/cjs/**/*.js'",
          "-> Generating Docs..."
        );
        changeDocsVersion(oldVersion, newVersion);
        await execute(
          `git add README.md && git commit -m "📝 docs: Updated docs for ${version}"`,
          "-> Commit Docs changes..."
        );
        await execute(`git checkout README.md`);
        console.log("-> Ready to Publish!");
        console.log("-> Please login to npm");

        rl.close();
      }
    );
  });
}

init();
