# QR 码工具 设计文档

## 概述

纯客户端二维码工具，支持生成（文本/URL / WiFi / vCard）和扫描（图片上传解码）。属于系统工具分类，路由 `/tools/qr-code`。

## 技术栈

- **生成:** `qrcode` npm 包 → Canvas/SVG 输出
- **解码:** `qr-scanner` npm 包 → 图片上传解码（静态模式，无需摄像头）
- **零后端依赖**，纯客户端运行

## 目录结构

```
src/
├── hooks/useQR.ts
│   └── 状态: generatorType, text, ssid, password, encryption, vcard fields
│   └── 方法: setType, generate, scanImage, reset
│   └── 状态: qrDataUrl, scannedText, scanning, error
│
├── components/qr/
│   ├── QrGenerator.tsx          ← 生成 Tab
│   │   ├── 类型选择器（标签/URL / WiFi / 名片）
│   │   ├── 动态表单（按类型切换）
│   │   ├── 二维码预览区（Canvas / SVG）
│   │   └── 下载按钮（PNG / SVG）
│   │
│   └── QrScanner.tsx            ← 扫描 Tab
│       ├── 文件上传区（拖拽/点击）
│       └── 解码结果展示 + 复制按钮
│
├── app/tools/qr-code/page.tsx   ← Tabs 容器页
└── types/qr.ts                  ← 类型定义（如需要）
```

## UI 布局

两个 Tab 切换：

### 生成 Tab

顶部类型选择器（三个标签按钮），按下切换表单。

- **文本/URL:** `<textarea>` 自由输入，placeholder 提示
- **WiFi:** SSID + 密码（可选） + 加密方式（WPA/WPA2/WEP/无）下拉
- **名片:** 姓名 + 电话 + 邮箱 + 公司

下方实时 QR 预览区（白色底 Canvas），选中可下载（右键 → 保存 / 点击下载按钮）。

### 扫描 Tab

上传区（虚线拖拽框 + "选择图片"按钮），支持 `.png/.jpg/.webp`。

解码中显示旋转加载，成功后显示解码文本 + 一键复制按钮。失败显示"无法识别二维码"提示。

## 状态矩阵

### 生成 Tab

| 状态 | 表现 |
|------|------|
| empty | 表单为空，预览区显示"输入内容后自动生成"占位 |
| normal | 实时生成二维码，预览区 Canvas 渲染 |
| error | 输入无效（如WiFi没有SSID），提示错误 |
| result | 二维码已生成，显示下载按钮 |

### 扫描 Tab

| 状态 | 表现 |
|------|------|
| empty | 未上传图片，显示拖拽上传区 |
| loading | 解码中，旋转动画 |
| result | 解码成功，显示文本 + 复制按钮 |
| error | 图片非二维码或无法识别，提示重试 |

## 数据流

```
── 生成 ──
用户输入表单 → useQR 更新字段 → watch 触发 → qrcode.toDataURL(text) → 更新预览
→ 点击下载 → Canvas 转 Blob → 触发 <a download>

── 扫描 ──
用户上传图片 → FileReader → Image → Canvas → ImageData → QrScanner.scanImage()
→ 返回 text → 显示结果
```

## 二维码格式标准

- **文本/URL:** 直接编码 UTF-8 字符串
- **WiFi:** `WIFI:T:<加密>;S:<SSID>;P:<密码>;;`（标准 WiFi QR 格式）
- **名片:** 标准 vCard 3.0 格式

## 依赖

```json
{
  "dependencies": {
    "qrcode": "^1.5.x",
    "qr-scanner": "^1.x"
  }
}
```

## 错误处理

- 生成：空输入不生成，显示提示
- 扫描：非图片文件拒绝，无法解码显示友好提示
- 下载：Canvas 为空不触发下载
