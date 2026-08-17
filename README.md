# dsh-synapse

**A visual, non-linear conversation workspace plugin for DeepSeek Harness.**

[中文](#中文) | [English](#english)

![Synapse workspace canvas](docs/images/synapse-ui.png)

## 中文

`dsh-synapse` 是一个独立的 DeepSeek Harness Web 插件。它不替代 DSH 的模型、工具、会话或权限逻辑，而是在原生对话界面上增加一个可视化工作台：将同一工作区内的会话、追问和分支呈现为可浏览的对话地图。

### 为什么使用它

复杂任务往往不是一条直线：你需要保留某个方案，回到第二轮问题尝试另一条路径，或在多个会话之间快速定位上下文。Synapse 让这些关系留在同一张画布上，同时继续使用 DSH 原有的会话能力。

### 功能

- **会话地图**：在 DSH 原生对话与可视化画布之间切换。
- **分支可见**：通过 DSH 原生 session fork 创建分支，并按真实分叉点连接节点。
- **工作区映射**：读取 DSH 工作区与目录归属，便于在正确的项目上下文中创建会话。
- **持续投影**：用户消息和助手回复会投影到对应卡片；流式回复可在详情中持续更新。
- **工具过程折叠**：工具调用与结果按 callId 配对后，折叠进对应助手回复卡，不再单独成卡。
- **画布交互**：拖动画布、缩放视图、移动卡片，并在卡片内部滚动长回复。
- **原生会话不变**：打开、追问、创建和归档仍由 DSH 会话系统完成；Synapse 只提供另一种查看与组织方式。

![Native dialogue and Synapse toggle](docs/images/native-webui.png)

### 安装

前提：已安装并可运行 DeepSeek Harness，且 Node.js 版本不低于 `22.19`。

#### 从 GitHub 安装

```powershell
corepack pnpm dsh plugin --profile web add github:liangmianya/dsh-synapse
corepack pnpm dsh web
```

GitHub 安装会执行本项目的 `prepare` 脚本。若 pnpm 提示需要授权构建脚本，请把 pnpm 打印的确切键（包名加其拉取的 tarball 地址，内含 commit）复制进 DSH profile 的 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  "dsh-synapse@https://codeload.github.com/liangmianya/dsh-synapse/tar.gz/<commit>": true
```

然后重新执行安装命令。在 pnpm 10.x 上裸包名匹配不到 git 依赖；上游推送新 commit 后该键会变化，届时复制 pnpm 新打印的键即可。

#### 本地开发安装

```powershell
corepack pnpm dsh plugin --profile web add -w link:E:\path\to\dsh-synapse
corepack pnpm dsh web
```

打开 `http://127.0.0.1:3080/`。顶部的“对话 / 会话地图”切换可在原生 DSH 对话与 Synapse 工作台之间往返。

### 使用方式

1. 在 DSH 中选择工作目录或打开一个已有会话。
2. 点击顶部的“会话地图”。
3. 在画布中查看该工作区的会话；在任意节点继续提问，或通过分支操作保留一条替代路径。
4. 点击节点可查看完整对话记录；点击关联会话可回到原生 DSH 对话。

### 卸载

```powershell
corepack pnpm dsh plugin --profile web remove dsh-synapse
```

### 数据与边界

- 画布元数据保存在 DSH Home 的 `synapse/workspaces.json`。
- 会话内容仍由 DSH session log 保存和管理。
- 本插件不启动第二个 Web 服务，不创建第二套 Agent，也不改变 DSH 的模型或工具执行行为。

---

## English

`dsh-synapse` is a standalone DeepSeek Harness Web plugin. It does not replace DSH models, tools, sessions, or permissions. Instead, it adds a visual workspace on top of the native conversation UI, turning related sessions, follow-ups, and forks into an explorable conversation map.

### Why Synapse

Complex work is rarely linear. You may need to preserve one approach, return to an earlier turn, and explore another path without losing context. Synapse keeps those relationships on one canvas while leaving DSH's native session behavior intact.

### Features

- **Session map**: Switch between the native DSH chat and a visual canvas.
- **Visible branches**: Create forks through DSH native session forks and connect them at their actual branching turn.
- **Workspace-aware**: Reflect DSH workspaces and directory ownership when creating or browsing sessions.
- **Live projection**: Project user messages and assistant replies into cards, including streaming reply updates in the detail view.
- **Folded tool process**: Tool calls and results pair by `callId` and fold into the assistant reply card instead of becoming standalone cards.
- **Canvas interaction**: Pan, zoom, move cards, and scroll long replies inside each card.
- **Native sessions stay native**: Opening, prompting, creating, and archiving sessions remains DSH-owned; Synapse only changes how they are viewed and organized.

### Installation

Prerequisites: a working DeepSeek Harness installation and Node.js `>= 22.19`.

#### Install from GitHub

```powershell
corepack pnpm dsh plugin --profile web add github:liangmianya/dsh-synapse
corepack pnpm dsh web
```

GitHub installs run this package's `prepare` script. If pnpm asks for build-script permission, copy the exact key pnpm printed — the package name plus its fetched tarball URL, which embeds the commit — into the DSH profile's `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  "dsh-synapse@https://codeload.github.com/liangmianya/dsh-synapse/tar.gz/<commit>": true
```

Then rerun the install command. On pnpm 10.x a bare package name does not match a git-hosted dependency; the key changes when the upstream repository pushes a new commit, so copy the newly printed key then.

#### Install a local checkout

```powershell
corepack pnpm dsh plugin --profile web add -w link:E:\path\to\dsh-synapse
corepack pnpm dsh web
```

Open `http://127.0.0.1:3080/`. Use the top “Dialogue / Session Map” switch to move between native DSH chat and the Synapse workspace.

### Usage

1. Select a working directory or open an existing DSH session.
2. Open “Session Map” from the top switch.
3. Browse sessions in the canvas, continue from a node, or fork an alternative path.
4. Select a node to inspect its full history, or return to its linked native DSH session.

### Uninstall

```powershell
corepack pnpm dsh plugin --profile web remove dsh-synapse
```

### Data and scope

- Canvas metadata is stored in `synapse/workspaces.json` under DSH Home.
- DSH remains the owner of session-log content.
- This plugin starts no second web server, creates no second agent, and does not modify model or tool execution.

## Development

```powershell
corepack pnpm install
corepack pnpm run build
corepack pnpm test
corepack pnpm pack
```

`npm pack --dry-run --json` is useful for reviewing the files that will be published before creating a release archive.

## License

[MIT](LICENSE)
