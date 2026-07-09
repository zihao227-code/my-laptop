# VS Code 环境搭建指南

## 一、安装扩展（5分钟）

在 VS Code 中按 `Ctrl+Shift+X` 打开扩展面板，搜索并安装以下扩展：

### 🔴 必装（4个）

| 扩展名称 | 搜索关键词 | 作用 |
|---------|-----------|------|
| **Live Preview** | `live preview` | 在 VS Code 里预览 HTML 页面 |
| **Markdown All in One** | `markdown all in one` | Markdown 写笔记的增强工具 |
| **Prettier** | `prettier` | 代码自动格式化，保持整洁 |
| **vscode-icons** | `vscode icons` | 文件图标美化，一眼找到文件 |

### 🟡 推荐（按需安装）

| 扩展名称 | 搜索关键词 | 作用 |
|---------|-----------|------|
| **Better Comments** | `better comments` | 让 TODO / FIXME 注释高亮 |
| **Error Lens** | `error lens` | 错误信息直接显示在代码行后面 |
| **Code Spell Checker** | `code spell checker` | 英文拼写检查 |
| **Color Highlight** | `color highlight` | CSS 颜色值显示实际颜色 |

### 安装方法
1. 按 `Ctrl+Shift+X`（或点击左侧栏方块图标）
2. 在搜索框输入上面的"搜索关键词"
3. 找到对应的扩展，点击 **Install**
4. 装完后可能需要点 **Reload** 或者重启 VS Code

---

## 二、验证安装

装完 Live Preview 后：
- 右键 `dashboard.html` → **Open Preview** 
- 或者右键 `dashboard.html` → **Open with Live Server** → 在浏览器打开

两种方式都能看到仪表盘。

---

## 三、快捷操作速查

| 操作 | 快捷键 |
|------|--------|
| 打开扩展面板 | `Ctrl+Shift+X` |
| 命令面板（万能搜索） | `Ctrl+Shift+P` |
| 快速打开文件 | `Ctrl+P` |
| 打开终端 | `Ctrl+`` ` |
| 保存文件 | `Ctrl+S` |
| Markdown 预览 | `Ctrl+Shift+V` |
| HTML 预览（需 Live Preview） | `Ctrl+Shift+P` → 搜 "Live Preview" |

---

## 四、Claude Code 相关

Claude Code 已经可以使用了（你正在和它对话）。不需要额外安装任何东西。

有用的 Claude Code 技能（已经内置）：
- `/help` — 查看帮助
- 直接在对话框里提问即可
