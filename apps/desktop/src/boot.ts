const trialApp = require("electron").app;
if (trialApp.isPackaged) {
  const metadata = JSON.parse(
    require("node:fs").readFileSync(
      require("node:path").join(trialApp.getAppPath(), "package.json"),
      "utf8",
    ),
  );
  process.env.T3CODE_DESKTOP_TRIAL = metadata.t3codeTrial === true ? "1" : "0";
  if (metadata.t3codeTrial === true) {
    process.env.T3CODE_HOME = require("node:path").join(
      require("node:os").homedir(),
      ".t3-multirepo-trial-desktop",
    );
    process.env.T3CODE_DISABLE_AUTO_UPDATE = "1";
  }
}
require("./compileCache.cjs");
require("./main.cjs");
