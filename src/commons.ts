import * as vscode from "vscode";
import * as ps from "child_process";

const detect = require("detect-port");

export function isForgeRunning(): boolean {
  const stdout = ps
    .execSync("ps aux | grep -e forge -e target/app -e runserver")
    .toString();
  const processes = stdout
    .split("\n")
    .filter((p) => !p.includes("grep") && p.trim().length > 0);
  return processes.length > 0;
}

export function getMindsmithsTerminal(): [vscode.Terminal, boolean] {
  const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
  const mindsmithsTerminals = terminals.filter(
    (terminal) =>
      terminal.creationOptions &&
      "env" in terminal.creationOptions &&
      terminal.creationOptions.env &&
      "mindsmiths" in terminal.creationOptions.env
  );
  if (mindsmithsTerminals.length > 0) {
    return [mindsmithsTerminals[0], false];
  } else {
    const profile = new vscode.TerminalProfile({
      name: "Forge",
      env: { mindsmiths: "forge-run" },
    });
    return [vscode.window.createTerminal(profile.options), true];
  }
}

export async function updatePortsStatusBarItem(
  item: vscode.StatusBarItem,
  cycles: number = 20
) {
  if (item.text === null || item.text === undefined) {
    item.text = "No active ports";
  }

  const listedPorts = getListedPorts();
  if (listedPorts.length > 0) {
    let takenPorts: Array<Number> = [];
    listedPorts.forEach((port) => {
      detect(port).then((matched: number) => {
        if (port !== matched) {
          takenPorts.push(port);
          takenPorts.sort();
        }
        if (takenPorts.length > 0) {
            item.text = "Ports: " + takenPorts.join(", ");
            const oldTooltip = item.tooltip;
            item.tooltip = buildPortsTooltip(takenPorts);
            if (oldTooltip !== item.tooltip) {
            }
        } else {
            item.text = "No active ports";
            item.tooltip = undefined;
        }
        item.show();
      });
    });
    if (cycles > 0) {
      setTimeout(async function () {
        updatePortsStatusBarItem(item, cycles - 1);
      }, 1000);
    }
  } else {
    item.text = "No active ports";
    item.tooltip = undefined;
  }
}

export function getListedPorts(): Array<Number> {
  let workspaceFolder;
  if (!vscode.workspace.workspaceFolders) {
    return [];
  } else {
    workspaceFolder = vscode.workspace.workspaceFolders[0];
  }
  let stdout = "";
  try {
    stdout = ps
      .execSync(
        "find . -maxdepth 3 -type f -name 'local.config.yaml' -exec grep -H 'port:' {} \\;",
        {
          cwd: workspaceFolder.uri.path,
        }
      )
      .toString();
  } catch (e) {}
  return Array.from(
    new Set(
      stdout
        .split("\n")
        .filter((l) => l.includes("port:"))
        .map((l) => parseInt(l.split("port:")[1].trim()))
    )
  );
}

function buildPortsTooltip(takenPorts: Array<Number>) {
  let tooltip = new vscode.MarkdownString();
  tooltip.isTrusted = true;
  tooltip.supportHtml = true;
  tooltip.value = "<div>";
  takenPorts.forEach((port) => {
    const url = process.env.ENV_URL
      ? `http://${port}.${process.env.ENV_URL}`
      : `http://localhost:${port}`;
    tooltip.value += `<p><a href='${url}'>${url}</a></p>`;
  });
  tooltip.value += "</div>";
  return tooltip;
}
