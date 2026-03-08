/**
 * 电台播放器核心业务逻辑
 */

// 全局电台数据存储
let radioStations = [];
let audioPlayer = null;

// 背景渐变色方案
const gradients = [
    "linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)",
    "linear-gradient(135deg, #4834D4 0%, #686DE0 100%)",
    "linear-gradient(135deg, #6AB04C 0%, #BAD531 100%)",
    "linear-gradient(135deg, #F093FB 0%, #F5576C 100%)",
    "linear-gradient(135deg, #F9CA24 0%, #F0932B 100%)",
    "linear-gradient(135deg, #22A6B3 0%, #7ED6DF 100%)",
    "linear-gradient(135deg, #EB4D4B 0%, #FF7979 100%)",
    "linear-gradient(135deg, #30336B 0%, #130F40 100%)",
    "linear-gradient(135deg, #BADC58 0%, #6AB04C 100%)"
];

// 电台状态
let playerState = {
    isPlaying: false,
    currentStation: null,
    volume: 100
};

// 省份名称到拼音文件名的映射（解决 Tauri 中文文件名问题）
const provinceFileMap = {
    '北京': 'beijing',
    '天津': 'tianjin',
    '河北': 'hebei',
    '山西': 'shanxi',
    '内蒙古': 'neimenggu',
    '辽宁': 'liaoning',
    '吉林': 'jilin',
    '黑龙江': 'heilongjiang',
    '上海': 'shanghai',
    '江苏': 'jiangsu',
    '浙江': 'zhejiang',
    '安徽': 'anhui',
    '福建': 'fujian',
    '江西': 'jiangxi',
    '山东': 'shandong',
    '河南': 'henan',
    '湖北': 'hubei',
    '湖南': 'hunan',
    '广东': 'guangdong',
    '广西': 'guangxi',
    '海南': 'hainan',
    '重庆': 'chongqing',
    '四川': 'sichuan',
    '贵州': 'guizhou',
    '云南': 'yunnan',
    '西藏': 'xizang',
    '陕西': 'shaanxi',
    '甘肃': 'gansu',
    '青海': 'qinghai',
    '宁夏': 'ningxia',
    '新疆': 'xinjiang'
};

// 分类名称到拼音文件名的映射
const categoryFileMap = {
    '综合台': 'zonghe',
    '音乐台': 'yinyue',
    '交通台': 'jiaotong',
    '资讯台': 'zixun',
    '经济台': 'jingji',
    '都市台': 'dushi',
    '生活台': 'shenghuo',
    '文艺台': 'wenyi',
    '网络台': 'wangluo',
    '旅游台': 'lvyou',
    '方言台': 'fangyan',
    '曲艺台': 'quyi',
    '体育台': 'tiyu',
    '双语台': 'shuangyu'
};

/**
 * 初始化应用
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 初始化音频对象
    audioPlayer = new Audio();

    // 2. 音频事件监听
    setupAudioListeners();

    // 3. 加载并渲染 JSON 数据
    const provinceSelect = document.getElementById('provinceSelect');
    const categorySelect = document.getElementById('categorySelect');

    if (provinceSelect) {
        provinceSelect.addEventListener('change', (e) => {
            // 切换省份时，清除分类选择
            if (categorySelect) categorySelect.value = '';
            loadAndRenderData(e.target.value, false);
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            if (e.target.value) {
                // 切换分类时，清除省份选择
                if (provinceSelect) provinceSelect.value = '';
                loadAndRenderData(e.target.value, true);
            }
        });
    }

    // 网络台按钮监听
    const networkRadioBtn = document.getElementById('networkRadioBtn');
    if (networkRadioBtn) {
        networkRadioBtn.addEventListener('click', () => {
            // 清除其他选择
            if (provinceSelect) provinceSelect.value = '';
            if (categorySelect) categorySelect.value = '';
            loadAndRenderData('网络台', true);
        });
    }

    // 默认加载北京电台
    if (provinceSelect) {
        await loadAndRenderData(provinceSelect.value, false);
    } else {
        await loadAndRenderData();
    }

    // 4. 初始化控制栏交互
    initControls();

    // 5. 启动时钟
    startClock();

    // 6. 暴露交互函数给全局空间
    window.playRadio = playRadio;
});

/**
 * 设置音频事件监听
 */
function setupAudioListeners() {
    audioPlayer.addEventListener('play', () => {
        playerState.isPlaying = true;
        updateUIState();
    });

    audioPlayer.addEventListener('pause', () => {
        playerState.isPlaying = false;
        updateUIState();
    });

    audioPlayer.addEventListener('error', (e) => {
        const error = audioPlayer.error;
        console.warn('音频资源加载遇到问题:', {
            code: error ? error.code : 'unknown',
            src: audioPlayer.src
        });
        playerState.isPlaying = false;
        updateUIState();
    });
}

/**
 * 加载并渲染数据
 * @param {string} name - 省份名或分类名
 * @param {boolean} isCategory - 是否为分类（默认false表示省份）
 */
async function loadAndRenderData(name = '北京', isCategory = false) {
    const grid = document.getElementById('radioGrid');
    grid.innerHTML = '<div class="loading">正在加载电台列表...</div>';

    try {
        // 根据类型使用不同的映射表
        const fileMap = isCategory ? categoryFileMap : provinceFileMap;
        const pinyinName = fileMap[name] || name;
        const filename = `${pinyinName}_radio_stations.json`;

        // 使用 new URL 构建正确的资源路径（兼容 Tauri 和普通 web 环境）
        const url = new URL(filename, import.meta.url);
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                 grid.innerHTML = `<div class="error" style="text-align: center; padding: 40px; color: #fff;">
                    <h2>未找到电台数据文件</h2>
                    <p style="margin: 10px 0;">缺少文件 <b>src/${filename}</b></p>
                    <p>由于本项目开源，没有内置真实的播放源，你需要手动配置这些文件。</p>
                    <p>请参考 <b>README.md</b> 或复制 <b>src/example_radio_stations.json</b> 来创建内容。</p>
                 </div>`;
                 return;
            }
            throw new Error(`无法读取 ${name} 的数据文件 (${response.status})`);
        }

        const data = await response.json();

        // 处理数据格式 (有些是对象，有些是包裹在数组里的对象)
        let radios = [];
        if (Array.isArray(data)) {
            radios = data[0].radios;
        } else if (data && data.radios) {
            radios = data.radios;
        }

        if (radios && radios.length > 0) {
            radioStations = radios.map((item, index) => {
                // 从 link 中提取电台 ID
                const idMatch = item.link.match(/radios\/(\d+)/);
                const radioId = idMatch ? idMatch[1] : null;

                return {
                    ...item,
                    id: index + 1,
                    radioId: radioId,
                    gradient: gradients[index % gradients.length],
                    shortName: item.name.replace(new RegExp(`${name}|广播|电台|之声`, 'g'), '') || item.name.slice(0, 2)
                };
            });

            // 渲染网格
            renderGrid();
            // 渲染侧边栏（热播/推荐）
            renderSidebar();
        } else {
            grid.innerHTML = `<div class="error">未找到 ${name} 的电台数据</div>`;
        }
    } catch (error) {
        grid.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
    }
}

/**
 * 检查文件是否存在（内部辅助）
 */
async function fileExists(url) {
    try {
        const response = await fetch(`/${url}`, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * 渲染主网格
 */
function renderGrid() {
    const grid = document.getElementById('radioGrid');
    grid.innerHTML = radioStations.map(station => `
    <div class="radio-card" data-id="${station.id}" onclick="playRadio(${station.id})">
      <div class="card-avatar" style="background: ${station.gradient}">
        <span class="placeholder-text">${station.shortName}</span>
        <div class="play-overlay">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="card-title">${station.name}</div>
      <div class="card-subtitle">正在直播</div>
      <div class="card-description">${station.province}</div>
    </div>
  `).join('');
}

/**
 * 渲染侧边栏
 */
function renderSidebar() {
    const hotList = document.getElementById('hotList');
    const historyList = document.getElementById('historyList');

    // 取前5个作为热播
    const hotData = radioStations.slice(0, 5);
    hotList.innerHTML = hotData.map(item => `
    <div class="list-item" onclick="playRadio(${item.id})">
      <div class="item-avatar" style="background: ${item.gradient}">
        <span class="avatar-text">${item.shortName}</span>
      </div>
      <div class="item-info">
        <div class="item-title">${item.name}</div>
        <div class="item-subtitle">热门推荐</div>
      </div>
    </div>
  `).join('');

    // 取最后5个作为听回听（模拟历史）
    const historyData = radioStations.slice(-5).reverse();
    historyList.innerHTML = historyData.map(item => `
    <div class="list-item" onclick="playRadio(${item.id})">
      <div class="item-avatar" style="background: ${item.gradient}">
        <span class="avatar-text">${item.shortName}</span>
      </div>
      <div class="item-info">
        <div class="item-title">${item.name}</div>
        <div class="item-subtitle">最近播放</div>
      </div>
    </div>
  `).join('');
}

/**
 * 播放电台
 */
function playRadio(id) {
    const station = radioStations.find(s => s.id === id);
    if (!station) return;

    playerState.currentStation = station;

    // 准备多个可能的流地址
    // 1. 原有的带签名的 URL (可能已过期)
    // 2. 蜻蜓 FM 常见的长效播放格式 (不带签名，有时可用)
    // 3. 另一种备用 CDN 格式
    const playUrls = [
        station.stream_url,
        `https://lhttp.qtfm.cn/live/${station.radioId}/64k.mp3`,
        `http://ls.qingting.fm/live/${station.radioId}.m3u8`
    ];

    let currentTry = 0;

    const tryPlay = (url) => {
        console.log(`正在尝试播放 (${currentTry + 1}/${playUrls.length}):`, url);
        audioPlayer.src = url;
        audioPlayer.play().catch(err => {
            console.warn('播放尝试失败:', url, err);
            retryNext();
        });
    };

    const retryNext = () => {
        currentTry++;
        if (currentTry < playUrls.length) {
            // 继续尝试下一个源
            setTimeout(() => tryPlay(playUrls[currentTry]), 300);
        } else {
            console.error('所有可用源均播放失败');
            document.getElementById('currentStationDesc').textContent = '所有播放源均失效，请尝试其他电台';
        }
    };

    // 重新设置错误监听以支持自动重试
    const tempErrorHandler = () => {
        audioPlayer.removeEventListener('error', tempErrorHandler);
        retryNext();
    };
    audioPlayer.addEventListener('error', tempErrorHandler);

    // 开始尝试
    tryPlay(playUrls[0]);

    // 更新UI信息
    document.getElementById('currentStationName').textContent = station.name;
    document.getElementById('currentStationDesc').textContent = station.province + '本地电台 (正在缓冲...)';
    document.getElementById('currentStationAvatar').style.background = station.gradient;

    // 更新卡片高亮
    document.querySelectorAll('.radio-card').forEach(card => {
        card.classList.toggle('playing', card.dataset.id == id);
    });
}

/**
 * 播放控制初始化
 */
function initControls() {
    const playBtn = document.getElementById('playBtn');
    const volSlider = document.getElementById('volumeSlider');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    playBtn.onclick = () => {
        if (playerState.isPlaying) {
            audioPlayer.pause();
        } else {
            if (playerState.currentStation) {
                audioPlayer.play();
            } else if (radioStations.length > 0) {
                playRadio(radioStations[0].id);
            }
        }
    };

    volSlider.oninput = (e) => {
        const vol = e.target.value / 100;
        audioPlayer.volume = vol;
        document.querySelector('.volume-value').textContent = `x ${vol.toFixed(1)}`;
    };

    prevBtn.onclick = () => {
        if (!playerState.currentStation) return;
        let idx = radioStations.findIndex(s => s.id === playerState.currentStation.id);
        idx = (idx - 1 + radioStations.length) % radioStations.length;
        playRadio(radioStations[idx].id);
    };

    nextBtn.onclick = () => {
        if (!playerState.currentStation) return;
        let idx = radioStations.findIndex(s => s.id === playerState.currentStation.id);
        idx = (idx + 1) % radioStations.length;
        playRadio(radioStations[idx].id);
    };
}

/**
 * 更新播放按钮外观
 */
function updateUIState() {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');

    if (playerState.isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

/**
 * 底部时钟刷新
 */
function startClock() {
    const update = () => {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toTimeString().split(' ')[0];

        // 进度条模拟（基于全天时间片）
        const totalSecs = 24 * 3600;
        const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const percent = (currentSecs / totalSecs) * 100;
        document.getElementById('progressFill').style.width = percent + '%';
    };
    setInterval(update, 1000);
    update();
}
