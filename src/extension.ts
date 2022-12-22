import * as vscode from "vscode";
import * as ps from "child_process";

import {
  isForgeRunning,
  getMindsmithsTerminal,
  updatePortsStatusBarItem,
  getListedPorts,
  readYaml,
} from "./commons";

const TEXTS = {
  forgeAlreadyRunning: "Can't run forge. It's already running.",
  forgeNotRunning: "Forge isn't running, nothing to stop.",
  blockedByForgeRunning: "Can't run command. Forge is currently running.",
};
let portsStatusBarItem: vscode.StatusBarItem;
let projectLocalConfig: Object;

export function activate(context: vscode.ExtensionContext) {
  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("mindsmiths-explorer.forgeRun", () => {
      if (isForgeRunning()) {
        vscode.window.showErrorMessage(TEXTS.forgeAlreadyRunning);
      } else {
        const [terminal, created] = getMindsmithsTerminal();
        terminal.show();
        if (created) {
          setTimeout(() => terminal.sendText("\nforge run"), 1000);
        } else {
          terminal.sendText("\nforge run");
        }
        updatePortsStatusBarItem(portsStatusBarItem, projectLocalConfig);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mindsmiths-explorer.forgeStop", () => {
      if (isForgeRunning()) {
        ps.execSync(
          "kill $(ps aux | grep -w 'forge run' | awk '{print $2}') &> /dev/null"
        );
        updatePortsStatusBarItem(portsStatusBarItem, projectLocalConfig);
      } else {
        vscode.window.showWarningMessage(TEXTS.forgeNotRunning);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mindsmiths-explorer.forgeToggleRun",
      () => {
        if (isForgeRunning()) {
          vscode.commands.executeCommand("mindsmiths-explorer.forgeStop");
        } else {
          vscode.commands.executeCommand("mindsmiths-explorer.forgeRun");
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mindsmiths-explorer.forgeInit", () => {
      if (isForgeRunning()) {
        vscode.window.showErrorMessage(TEXTS.blockedByForgeRunning);
      } else {
        const [terminal, created] = getMindsmithsTerminal();
        terminal.show();
        if (created) {
          setTimeout(() => terminal.sendText("\nforge init"), 1000);
        } else {
          terminal.sendText("\nforge init");
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mindsmiths-explorer.forgeInstall", () => {
      if (isForgeRunning()) {
        vscode.window.showErrorMessage(TEXTS.blockedByForgeRunning);
      } else {
        const [terminal, created] = getMindsmithsTerminal();
        terminal.show();
        if (created) {
          setTimeout(() => terminal.sendText("\nforge install"), 1000);
        } else {
          terminal.sendText("\nforge install");
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mindsmiths-explorer.forgeReset", () => {
      if (isForgeRunning()) {
        vscode.window.showErrorMessage(TEXTS.blockedByForgeRunning);
      } else {
        const [terminal, created] = getMindsmithsTerminal();
        terminal.show();
        if (created) {
          setTimeout(() => terminal.sendText("\nforge reset"), 1000);
        } else {
          terminal.sendText("\nforge reset");
        }
      }
    })
  );

  // Process `config/local.config.yaml`
  projectLocalConfig = readYaml("config/local.config.yaml");

  // Ports status bar item
  if (getListedPorts(projectLocalConfig).size > 0) {
    portsStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    portsStatusBarItem.show();
    updatePortsStatusBarItem(portsStatusBarItem, projectLocalConfig);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
