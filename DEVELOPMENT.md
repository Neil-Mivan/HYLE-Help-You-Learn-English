# 运行 Vue 3 与 Java 本地版

本地开发版使用 Vue 3、Vite 和 Spring Boot。[仓库首页](README.md) 提供已发布的 v0.1.0 Windows 便携版下载。

构建需要 JDK 17+、Maven 3.9，以及带 npm 的 Node.js 22.12+。在项目根目录执行：

```shell
mvn clean package
java -jar target/hyle.jar
```

用浏览器打开 `http://127.0.0.1:4173/`，按 Ctrl+C 停止。Maven 会按 `frontend/package-lock.json` 安装依赖，运行 Vite，将编译好的 Vue 页面、脚本和样式打入 JAR。运行成品只需要 Java。启动时从当前目录读取 `.env.local`，也支持原有环境变量和网页输入的个人千问 Key。

修改界面时，可先运行 JAR，再在 `frontend/` 执行 `npm run dev`。开发服务器把 `/api` 转发到本机 4173 端口。开发预览使用独立端口及对应的浏览器存储。完成后在根目录重新执行 `mvn clean package`。

Windows 上构建一次后，双击 `launch.cmd` 可自动打开网页，在最后一个标签页关闭后退出。使用 `start.cmd` 可持续运行并查看日志。沿用相同地址和浏览器即可读取原有文章和笔记。

构建后，在项目根目录执行 `node --test tests/backend-contract.mjs frontend/tests/reading.test.mjs`。接口测试使用本机模拟千问服务；界面测试用独立的 Chrome 浏览器会话验证导入、查词、高亮、复习和阅读位置。可用 `HYLE_BROWSER` 指定 Chromium 浏览器可执行文件，`JAVA_HOME` 指向 JDK 17+。

## 开发者：重建 v0.1.0 系列 Windows 便携版（旧 Node.js 后端）

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
frontend/src/App.vue         Vue 页面导航、阅读恢复和应用入口
frontend/src/views/          文章库、阅读、翻译、生词本和“我的”
frontend/src/learning.js     响应式学习记录与本地存储
frontend/src/api.js          API 配置、同源请求与本地翻译
frontend/src/useLookup.js    阅读选区、翻译缓存、笔记与生词
index.html                   v0.1.0 兼容网页
styles.css                   页面样式和响应式布局
app.js                       v0.1.0 兼容前端逻辑
src/main/java/org/hyle/      Java 后端、阅读接口、千问客户端与标签页会话
pom.xml                      Maven 构建，生成 target/hyle.jar
server.mjs                   v0.1.0 兼容后端
start.cmd                    持续运行和排错启动方式
launch.cmd                   自动打开、自动停止的日常启动方式
configure-api.cmd            安全配置普通百炼 API Key
configure-api.mjs            Key 输入与本地配置逻辑
build-portable.ps1           Windows 便携版构建脚本
PORTABLE-README-zh-CN.txt    便携包内中文使用说明
.env.example                 环境变量示例
```
