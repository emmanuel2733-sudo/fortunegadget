const { spawn } = require("child_process");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const npmExecPath = process.env.npm_execpath;

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  child.on("error", (error) => {
    console.error(`Failed to start ${command}:`, error.message);
    process.exitCode = 1;
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
}

function runNpm(args, options = {}) {
  if (npmExecPath) {
    return run(process.execPath, [npmExecPath, ...args], options);
  }

  return run(npmCmd, args, options);
}

const backend = runNpm(["run", "dev"], { cwd: "backend" });
const frontend = runNpm(["run", "start"]);

function shutdown(signal) {
  if (backend && !backend.killed) {
    backend.kill(signal);
  }
  if (frontend && !frontend.killed) {
    frontend.kill(signal);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
