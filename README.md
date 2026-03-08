# 电台播放器 (Radio Player)

一个跨平台的电台播放客户端（基于 Tauri + Vite）。

![电台播放器预览](https://github.com/sailsxq/Radio-Player/blob/main/screenshots/preview.PNG)

## 📻 数据配置说明 (重要)

本项目为开源项目，**不自带真实的电台源数据**。为了让程序正常运行，你需要自行准备电台数据文件。

### 如何配置数据

1. 进入 `src` 目录。
2. 你会看到一个 `example_radio_stations.json` 文件。
3. 复制这个文件，或者参考它的格式，创建以省份拼音命名的 JSON 文件。
4. **例如：** 如果你想添加北京的电台，请新建 `beijing_radio_stations.json` 并填入真实的流媒体地址。
5. 包含的分类或者省份请参考 `src/main.js` 中的 `provinceFileMap` 和 `categoryFileMap` 变量映射来进行命名。


## 开发指南

### 推荐 IDE
- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
