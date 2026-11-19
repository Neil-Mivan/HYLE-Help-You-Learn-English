澄读 HYLE v0.2.0 · Windows x64 便携版
========================

开始使用

1. 请先完整解压 ZIP，不要直接在压缩包预览窗口中运行。
2. 双击 START-HYLE.cmd。
3. 浏览器会自动打开 http://127.0.0.1:4173/。
4. 关闭澄读网页后，本地服务会自动结束。

第一次使用

1. 网站会先显示文章库。
2. 点击“导入文章”，粘贴英文标题和正文。
3. 不使用 AI 时也能完成本地排版、阅读、笔记和高亮。
4. 需要 AI 时，点击网页右上角“连接 API”，粘贴自己的完整千问 Key。

AI 翻译

- 阅读、文章库、笔记等本地功能无需 API Key。
- AI 翻译和分析需要联网，并使用你自己的阿里云百炼（千问）API Key。
- 可以在网页右上角临时连接个人 Key；Key 只保存在当前浏览器中。
- 也可以双击 configure-api.cmd，把 Key 保存到本目录的 .env.local。
- 请勿把 .env.local 或自己的 API Key 发送给他人。
- Key 必须是创建时保存的完整明文，控制台中显示为 **** 的遮罩内容不能使用。

隐私

- 文章、笔记、阅读进度默认保存在当前浏览器的本地存储中。
- 本便携包不包含开发者的 API Key、文章、笔记或浏览器数据。
- AI 功能会把需要处理的文本发送给所配置的千问接口。

故障排除

- 服务默认仅监听本机，不需要对公网开放端口。
- 如果提示端口 4173 被占用，请先关闭之前打开的澄读窗口和命令行窗口，再重试。
- 本便携版自带 Eclipse Temurin Java 17 运行时，不需要安装 Java、Node.js 或 Maven。
- 从旧版升级：先关闭旧版网页和服务，把新版完整解压到新文件夹，用同一浏览器访问原来的 http://127.0.0.1:4173/。不要清除浏览器数据。如果以前用 configure-api.cmd 配置了 Key，请在新版重新配置，或私下将旧目录的 .env.local 复制到新版目录。

运行时与许可证

内置官方 Eclipse Temurin 17.0.21+9 Windows x64 JRE。许可证见 runtime/legal；
发行文件与对应源码：https://github.com/adoptium/temurin17-binaries/releases/tag/jdk-17.0.21%2B9

项目主页

https://github.com/Neil-Mivan/HYLE-Help-You-Learn-English
