# Radio Player

A cross-platform radio streaming client (built with Tauri + Vite).

![电台播放器预览](https://github.com/sailsxq/Radio-Player/blob/main/screenshots/preview.PNG)

## 📻 Data Configuration (Important)

This is an open-source project and **does not include real radio station source data**. In order for the application to function properly, you need to provide your own radio station data files.

### How to Configure Data

1. Navigate to the `src` directory.
2. You will find an `example_radio_stations.json` file.
3. Copy this file, or use its format as a reference, to create JSON files named after the Pinyin of provinces.
4. **For example:** If you want to add radio stations for Beijing, create a new `beijing_radio_stations.json` file and populate it with real streaming URLs.
5. For the included categories or provinces, please refer to the `provinceFileMap` and `categoryFileMap` variable mappings in `src/main.js` for naming conventions.


## Development Guide

### Recommended IDE Setup
- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
