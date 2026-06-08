# 音乐播放器布局修复

## 问题

ImmersiveLayout 右侧使用 `flex-1`（歌词区）+ `shrink-0`（控制栏）布局，导致歌词区撑满全部剩余空间，控制栏被压到底部，整体视觉重心偏下。

## 目标

右侧歌词区与控制栏按固定比例分割（约 62.5% / 37.5%），控制栏底部留余量不贴底。有歌词时不撑满，无歌词时布局收缩合理。

## 改动文件

- `src/components/music-player/ImmersiveLayout.tsx`

## 布局调整

### 右侧容器

当前: `flex-1 flex-col min-h-0 lg:min-h-0`
改为: `flex-1 flex-col h-full`

### 歌词区

当前: `flex-1 min-h-0`
改为: `flex-[5] min-h-0 pb-2`

### 控制栏

当前: `shrink-0 rounded-2xl lg:rounded-3xl px-4 pb-4 pt-3 ...`
改为: `flex-[3] rounded-2xl lg:rounded-3xl px-4 pb-4 pt-3 ...`，并在容器上增加底部空隙

控制栏外层（包裹控制栏的父容器）不再紧贴底部，控制栏底部留 `mb-6 lg:mb-8` 间距。

### 移动端 vinyl 区

`min-h-[40vh]` → `min-h-[35vh]`，给右侧更多空间。

### 边角情况

- 无歌词时 "暂无歌词" / 未选歌时 "选择歌曲开始播放"：保持歌词区域内部居中
- 短歌词：歌词区内部 `py-[15vh]`（已由 LyricsView 自身控制，不动）
- 控制栏始终居中在 flex-[3] 区域内，上下 padding 保证不贴边

## 不动的内容

- VinylDisc、TrackInfo、LyricsView、ProgressBar、PlaybackControls、VolumeControl、SpectrumAnalyzer 组件代码不动
- PlaylistDrawer 不动
- 初始空状态（FileDropZone）不动
- 主题 CSS 变量不动
