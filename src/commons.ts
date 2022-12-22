import * as fs from "fs";

import * as vscode from "vscode";
import * as ps from "child_process";

import * as YAML from "yaml";

const detect = require("detect-port");

type Service = {
  port: number | null;
};

export function isForgeRunning(): boolean {
  const stdout = ps.execSync("ps aux | grep -w 'forge run'").toString();
  const processes = stdout
    .split("\n")
    .filter((p) => !p.includes("grep") && p.trim().length > 0);
  return processes.length > 0;
}

export function getMindsmithsTerminal(): [vscode.Terminal, boolean] {
  const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
  const mindsmithsTerminals = terminals.filter(
    (terminal) => terminal.name === "Forge"
  );
  if (mindsmithsTerminals.length > 0) {
    return [mindsmithsTerminals[0], false];
  } else {
    const terminal = vscode.window.createTerminal("Forge");
    const workspaceFolder = getMainWorkspace();
    if (workspaceFolder) {
      terminal.sendText(`cd ${workspaceFolder.uri.path}`);
    }
    return [terminal, true];
  }
}

export async function updatePortsStatusBarItem(
  item: vscode.StatusBarItem,
  projectLocalConfig: any,
  cycles: number = 20
) {
  if (item.text === null || item.text === undefined) {
    item.text = "No active ports";
  }

  const listedPorts = getListedPorts(projectLocalConfig);
  if (listedPorts.size > 0) {
    let takenPorts: Array<Number> = [];
    for (const [port, serviceName] of listedPorts) {
      detect(port).then((matched: number) => {
        if (port !== matched) {
          takenPorts.push(port);
          takenPorts.sort();
        }
        if (takenPorts.length > 0) {
          item.text =
            "Ports: " +
            takenPorts.map((port) => listedPorts.get(port)).join(", ");
          const oldTooltip = item.tooltip;
          item.tooltip = buildPortsTooltip(listedPorts, takenPorts);
          if (oldTooltip !== item.tooltip) {
          }
        } else {
          item.text = "No active ports";
          item.tooltip = undefined;
        }
        item.show();
      });
    }
    if (cycles > 0) {
      setTimeout(async function () {
        updatePortsStatusBarItem(item, projectLocalConfig, cycles - 1);
      }, 1000);
    }
    else {
      setTimeout(async function () {
        updatePortsStatusBarItem(item, projectLocalConfig, cycles);
      }, 5000);
    }
  } else {
    item.text = "No active ports";
    item.tooltip = undefined;
  }
}

export function readYaml(path: string): any {
  const workspaceFolder = getMainWorkspace();
  if (!workspaceFolder) {
    return;
  }
  path = `${workspaceFolder.uri.path}/${path}`;

  if (!path || !fs.existsSync(path)) {
    return;
  }
  const file = ps.execSync(`cat ${path}`).toString();
  return YAML.parse(file);
}

export function getListedPorts(projectLocalConfig: any): Map<Number, String> {
  if (!projectLocalConfig || !projectLocalConfig.services) {
    return new Map();
  }
  let ports = new Map();
  for (let [serviceName, serviceRaw] of Object.entries(
    projectLocalConfig.services
  )) {
    if (!serviceRaw) {
      continue;
    }
    const service = <Service>serviceRaw;
    if (service.port) {
      ports.set(service.port, serviceName);
    }
  }
  return ports;
}

function buildPortsTooltip(
  listedPorts: Map<Number, String>,
  takenPorts: Array<Number>
): vscode.MarkdownString {
  let tooltip = new vscode.MarkdownString();
  tooltip.isTrusted = true;
  tooltip.supportHtml = true;
  tooltip.value = "<div>";
  takenPorts.forEach((port) => {
    const url = process.env.ENV_URL
      ? `http://${port}.${process.env.ENV_URL}`
      : `http://localhost:${port}`;
    tooltip.value += `<p><a href='${url}' target='_blank'>${listedPorts.get(
      port
    )}</a></p>`;
  });
  tooltip.value += "</div>";
  return tooltip;
}

export function getMainWorkspace(): vscode.WorkspaceFolder | undefined {
  if (!vscode.workspace.workspaceFolders) {
    return undefined;
  }
  let bestFolder = vscode.workspace.workspaceFolders[0];
  for (let folder of vscode.workspace.workspaceFolders) {
    if (folder.uri.path.length < bestFolder.uri.path.length) {
      bestFolder = folder;
    }
  }
  return bestFolder;
}
