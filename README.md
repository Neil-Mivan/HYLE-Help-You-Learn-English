# 澄读 · HYLE

一个面向雅思阅读和日常英语精读的本地学习工具。

导入英文文章后，可以自动整理排版、查词翻译、分析语境、拆解长难句，并记录高亮、笔记、生词和阅读进度。

无需注册账号，文章与学习记录默认保存在使用者自己的浏览器中。

## Windows 便携版：下载、解压、双击即用

适用于大多数 Windows 11 电脑，不需要安装 Node.js，也不需要运行 `npm install` 或输入命令。

### [下载最新 Windows x64 便携版](https://github.com/Neil-Mivan/HYLE-Help-You-Learn-English/releases/latest/download/HYLE-Windows-Portable-v0.1.0-x64.zip)

备用入口：[查看所有 Releases](https://github.com/Neil-Mivan/HYLE-Help-You-Learn-English/releases)

### 三步开始

1. 下载 `HYLE-Windows-Portable-v0.1.0-x64.zip`
2. 右键 ZIP，选择 **“全部解压缩”**
3. 进入解压后的文件夹，双击 `START-HYLE.cmd`

浏览器会自动打开：

```text
http://127.0.0.1:4173/
```

关闭最后一个澄读网页后，本地服务会自动结束。

> 不要直接在 ZIP 压缩包预览窗口中运行 `START-HYLE.cmd`。
>
> GitHub 自动生成的 `Source code (zip)` 只是源码，不是开箱即用的便携版。

## 使用前需要知道

| 项目 | 是否需要 |
| --- | --- |
| Windows 11 x64 | 需要 |
| 安装 Node.js | 不需要，便携版已内置 |
| 安装其他软件 | 不需要，使用系统浏览器 |
| 注册澄读账号 | 不需要 |
| 阅读、排版、笔记和文章库 | 无 API Key 也能使用 |
| AI 翻译、语境解释和长难句分析 | 需要联网和自己的千问 API Key |

便携包不会包含开发者的 API Key、私人文章、笔记或浏览器数据。

## 完整使用教程

### 1. 下载正确的文件

进入 [Releases 页面](https://github.com/Neil-Mivan/HYLE-Help-You-Learn-English/releases)，在最新版本的 `Assets` 中下载：

```text
HYLE-Windows-Portable-v0.1.0-x64.zip
```

不要下载：

```text
Source code (zip)
Source code (tar.gz)
```

### 2. 完整解压

在下载好的 ZIP 上单击右键，选择：

```text
全部解压缩
```

建议解压到桌面或文档目录。不要从压缩包预览窗口直接双击启动文件。

### 3. 启动澄读

打开解压后的文件夹，双击：

```text
START-HYLE.cmd
```

它会使用便携包内置的 Node.js 启动本地服务，并自动打开浏览器。

本地服务只监听 `127.0.0.1`，不会自动把网站公开到互联网。

### 4. 连接自己的千问 API

不连接 API 也可以先使用文章库、本地排版、高亮、笔记和阅读进度。

需要 AI 功能时：

1. 点击网页右上角的“连接 API”
2. 粘贴完整的阿里云百炼 API Key
3. 在自己的电脑上可以勾选“在这台设备上记住”
4. 点击“保存并自动连接”

当前已兼容旧版 `sk-`、新版 `sk-ws` 和套餐专属 `sk-sp-` 等 Key 外观。遮罩内容如 `sk-****` 不是完整 Key，不能使用。

阿里云不同套餐、地域和协议的 Key 必须与对应 Base URL 配套。便携版默认使用中国内地普通百炼按量付费的 OpenAI 兼容地址：

```text
https://dashscope.aliyuncs.com/compatible-mode/v1
```

如果使用 Token Plan、Coding Plan、海外地域或业务空间专属 Key，需要按照阿里云控制台提供的地址调整 `.env.local`，且应确认相应套餐允许当前用途。

也可以双击：

```text
configure-api.cmd
```

把普通百炼 Key 保存到当前解压目录的 `.env.local`。修改后需要关闭旧服务并重新启动。

### 5. 导入和阅读文章

1. 网站启动后默认进入“文章库”
2. 点击“导入文章”
3. 粘贴英文标题和正文
4. 按需选择是否使用 AI 自动识别标题与正文结构
5. 完成导入后会直接进入阅读页面

阅读时可以：

- 单击或双击单词查看语境翻译
- 拖选词组、句子或段落进行整体翻译
- 按需查看“为什么这样翻译”
- 对六词以上的句子使用“长难句拆解”
- 调整正文字号
- 隐藏目录和翻译侧栏
- 添加高亮、笔记和生词

离开文章后，可以通过导航中的“继续阅读《文章名》”回到原文并恢复阅读位置。

## 主要功能

### 文章阅读

- 从文章库选择文章并进入专注阅读
- 本地规则整理标题与段落
- 可选 AI 自动识别标题、正文结构和小标题
- 清爽阅读排版与正文字号调节
- 导入后自动进入新文章
- 记录文章与段落阅读位置
- 段落级全文对照翻译

### 翻译与精读

- 独立 AI 翻译页，不进入文章也能查询单词、词组和句子
- 单词查询按词性整理常用义项并提供例句
- 词组和句子生成完整中文翻译
- 单击、双击或框选内容打开精读栏
- 结合上下文解释单词为何采用当前译义
- 按需拆解长难句，不会在每次翻译时额外消耗 Token
- 浏览器发音
- 精读栏内容过长时可独立滚动

### 学习工具

- 三色荧光笔高亮
- 选段笔记和文章笔记
- 生词本与复习记录
- 本地文章库和学习统计
- 一键清除本地学习数据

## 隐私与数据

- 文章、笔记、高亮、生词和阅读进度默认保存在当前浏览器的本地存储中
- 不需要澄读账号、数据库或云端个人主页
- 独立翻译只发送当前输入，不附带文章库、笔记或阅读历史
- 普通查词会发送所选内容及其所在句子，以获得准确语境译义
- 启用 AI 结构整理时，导入的整篇文章会发送给千问一次
- 关闭 AI 结构整理后，仅使用本地规则整理文章
- 个人 API Key 仅在调用时经本机服务转发，不会写入项目日志
- `.env.local`、API Key、浏览器数据和私人文章不会被打包进官方便携版

不要把已经配置了 `.env.local` 的私人副本再次上传或发送给别人。

## 常见问题

### 提示 `launch.cmd` 不是命令

说明你很可能在 ZIP 压缩包预览窗口里直接运行了 `START-HYLE.cmd`。

请返回 ZIP 文件，右键选择“全部解压缩”，再从解压后的文件夹启动。新版入口也会主动检测这种情况并给出提示。

### Key 明明完整，却提示格式不完整

请确认使用的是最新便携版。2026-07-28 版本已经修复新版 `sk-ws` Key 中合法符号被旧规则误判的问题。

关闭旧网页和旧服务，重新解压最新版并启动。如果浏览器仍显示旧界面，可以按 `Ctrl + F5` 强制刷新。

### 配置 API 后仍显示未连接

检查：

- Key 是否为创建时保存的完整明文，而不是控制台里的 `****` 遮罩内容
- Key 与 Base URL 是否属于同一套餐和地域
- 百炼余额、套餐状态和模型权限是否正常
- 配置完成后是否重新启动了澄读

### 端口 4173 已被占用

先关闭之前打开的澄读网页和黑色窗口，再重新运行 `START-HYLE.cmd`。

开发者也可以临时使用其他端口：

```powershell
$env:PORT=4174
node server.mjs
```

### Windows 弹出安全或防火墙提示

便携版包含官方 Node.js 运行文件，因此 Windows 可能在首次运行时询问权限。服务默认只监听本机。

如果防火墙询问网络权限，只需要按自己的安全策略允许专用网络；不需要开放公网端口。

## 开发者：从源码运行

源码使用原生 HTML、CSS、JavaScript 和 Node.js，没有第三方 npm 运行依赖。

需要：

- Node.js 18 或更高版本
- Windows、macOS 或 Linux 终端

```powershell
git clone https://github.com/Neil-Mivan/HYLE-Help-You-Learn-English.git
cd HYLE-Help-You-Learn-English
node server.mjs
```

然后访问：

```text
http://127.0.0.1:4173/
```

Windows 用户也可以直接运行 `launch.cmd` 或 `start.cmd`。

## 开发者：构建 Windows 便携版

在 Windows PowerShell 中运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-portable.ps1 -ReleaseVersion 0.1.0
```

构建脚本会：

1. 从 Node.js 官方网站读取校验清单
2. 下载 Windows x64 官方运行时
3. 验证 Node.js ZIP 的 SHA-256
4. 按文件白名单复制网站代码
5. 排除 `.env.local`、Git 数据、测试文件和个人数据
6. 在 `dist` 中生成便携文件夹、ZIP 和 SHA-256 校验文件

Windows on ARM 可以使用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-portable.ps1 -Architecture arm64 -ReleaseVersion 0.1.0
```

## 项目结构

```text
index.html                   网页结构
styles.css                   页面样式和响应式布局
app.js                       阅读、翻译、笔记和本地数据逻辑
server.mjs                   本机 HTTP 服务与千问 API 代理
start.cmd                    持续运行和排错启动方式
launch.cmd                   自动打开、自动停止的日常启动方式
configure-api.cmd            安全配置普通百炼 API Key
configure-api.mjs            Key 输入与本地配置逻辑
build-portable.ps1           Windows 便携版构建脚本
PORTABLE-README-zh-CN.txt    便携包内中文使用说明
.env.example                 环境变量示例
```

## 2026-07-28 更新

### Windows 便携版

- 新增 `HYLE-Windows-Portable-v0.1.0-x64.zip`
- 内置经过官方 SHA-256 校验的 Node.js Windows x64 运行时
- 用户无需安装 Node.js、npm 或其他依赖
- 新增 `START-HYLE.cmd` 一键启动入口
- 自动打开网页，并在最后一个页面关闭后自动停止服务
- 检测从 ZIP 预览窗口直接运行的错误方式，并提示先“全部解压缩”
- 发布包使用明确文件白名单，不包含 API Key、文章、笔记和开发数据

### 千问连接修复

- 修复新版 `sk-ws` Key 中合法符号被误判为“不完整”的问题
- 统一网页、服务端和本机配置脚本的 Key 校验标准
- 兼容 `sk-`、`sk-ws` 和 `sk-sp-` 外观
- 继续拒绝遮罩 Key、过短 Key、错误前缀和不可见复制字符
- 更新前端资源版本，避免浏览器继续使用旧校验缓存

### 阅读与翻译

- 新增独立 AI 翻译页
- 单词查询按词性展示义项与例句
- 词组和句子提供完整中文翻译
- 默认从文章库开始，再进入具体文章阅读
- 将“学习页”改为“我的”，移除无实际作用的“混合模式”
- 新增“继续阅读《文章名》”入口并恢复阅读位置
- 修复单击、双击与拖选翻译状态不同步
- 修复导入文章后仍停留在旧页面
- 修复翻译侧栏内容过长无法滚动
- 修复音频与关闭按钮重叠
- 支持隐藏目录和翻译侧栏、调整正文字号
- 新增按需语境解释和长难句拆解，减少不必要的 Token 消耗

完整记录参见 [CHANGELOG.md](./CHANGELOG.md)。

## 反馈

发现问题时，可以在 GitHub Issues 中提供：

- Windows 和浏览器版本
- 使用的是便携版还是源码版
- 复现步骤
- 实际结果与预期结果
- 不包含 API Key、私人文章或个人信息的截图
