"use client";

import { useState, useRef, useEffect } from "react";
import { useDownload } from "@/hooks/useDownload";
import { UrlInput } from "./UrlInput";
import { VideoInfoPanel } from "./VideoInfoPanel";
import { FormatSelector } from "./FormatSelector";
import { DownloadTaskProgress } from "./TaskProgress";
import { FileList } from "./FileList";

const BROWSER_LABELS: Record<string, string> = {
  chrome: "Chrome",
  edge: "Edge",
  firefox: "Firefox",
  brave: "Brave",
  opera: "Opera",
  chromium: "Chromium",
};

function browserLabel(id: string): string {
  return BROWSER_LABELS[id] || id;
}

type TabId = "download" | "files";

const TABS: { id: TabId; label: string }[] = [
  { id: "download", label: "下载" },
  { id: "files", label: "已下载" },
];

export function DownloadLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("download");
  const [useCookies, setUseCookies] = useState(false);
  const [cookiesFile, setCookiesFile] = useState("");
  const [uploadingCookie, setUploadingCookie] = useState(false);
  const originalUrlRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    activeTask,
    isProcessing,
    error,
    metadata,
    isParsing,
    parseError,
    files,
    filesLoading,
    parseUrl,
    startDownload,
    cancelDownload,
    clearTask,
    clearMetadata,
    setError,
    uploadCookies,
    refreshFiles,
    deleteFile,
    cleanupAll,
    getDownloadUrl,
    availableBrowsers,
    selectedBrowser,
    detectBrowsers,
    setSelectedBrowser,
    restoreCookies,
  } = useDownload();

  const handleParse = async (url: string) => {
    originalUrlRef.current = url;
    clearMetadata();
    try {
      await parseUrl(
        url,
        useCookies ? cookiesFile : "",
        selectedBrowser || ""
      );
    } catch {
      // parseError is set by the hook
    }
  };

  const handleStartDownload = async (formatId: string) => {
    if (!metadata) return;
    try {
      await startDownload({
        url: originalUrlRef.current,
        formatId,
        format: formatId === "ba" ? "audio" : "video",
        title: metadata.title,
        platform: metadata.platform,
        cookiesFile: useCookies ? cookiesFile : "",
        browser: selectedBrowser || undefined,
      });
    } catch {
      // error is set by the hook
    }
  };

  const handleCookieFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCookie(true);
    try {
      const result = await uploadCookies(file);
      setCookiesFile(result.filename);
      setUseCookies(true);
      if (result.warning) {
        setError(result.warning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cookie 文件上传失败");
    } finally {
      setUploadingCookie(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Detect browsers and restore cookies on mount
  useEffect(() => {
    detectBrowsers();
    restoreCookies().then((filename) => {
      if (filename) {
        setCookiesFile(filename);
        setUseCookies(true);
      }
    });
  }, [detectBrowsers, restoreCookies]);

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {(error || parseError) && (
        <div
          className="glass rounded-2xl p-4 border border-red-400/20 flex items-center justify-between"
        >
          <span className="text-sm text-red-400">{error || parseError}</span>
          <button
            onClick={() => {
              setError(null);
              clearMetadata();
            }}
            className="text-red-400/60 hover:text-red-400 transition-colors ml-3 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30"
                : "text-[var(--color-text-secondary)] hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "download" ? (
        <div className="glass rounded-3xl p-6 space-y-5">
          <UrlInput
            onParse={handleParse}
            isParsing={isParsing}
            disabled={isProcessing}
          />

          {/* Cookies / Browser auth */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={useCookies || !!selectedBrowser}
                onClick={() => {
                  if (!useCookies && !selectedBrowser && !cookiesFile) {
                    // First toggle: prefer browser if available, else file upload
                    if (availableBrowsers.length > 0) {
                      setSelectedBrowser(availableBrowsers[0]);
                    } else {
                      fileInputRef.current?.click();
                    }
                  } else {
                    setUseCookies(false);
                    setSelectedBrowser("");
                  }
                }}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                  useCookies || selectedBrowser ? "bg-[var(--color-accent)]" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    useCookies || selectedBrowser ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">
                使用登录态（获取 1080P+ 画质）
              </span>
            </label>

            {selectedBrowser && (
              <div className="ml-11 space-y-1">
                <p className="text-[11px] text-green-400/80">
                  ✓ 将从 {browserLabel(selectedBrowser)} 读取登录态
                </p>
                {selectedBrowser !== "firefox" && (
                  <p className="text-[11px] text-yellow-400/70">
                    ⚠ {browserLabel(selectedBrowser)} 运行时会锁定 Cookie 文件，可关闭后再试；如新版 Chrome 加密不兼容，建议改用 Firefox 或「导入 cookies.txt」
                  </p>
                )}
              </div>
            )}

            {cookiesFile && (
              <p className="text-[11px] text-green-400/80 ml-11">
                ✓ Cookie 已导入
              </p>
            )}

            {/* Browser selection */}
            {availableBrowsers.length > 0 && !useCookies && !selectedBrowser && (
              <div className="ml-11 space-y-2">
                <p className="text-xs text-[var(--color-text-secondary)]">选择浏览器：</p>
                <div className="flex flex-wrap gap-2">
                  {availableBrowsers.map((browser) => (
                    <button
                      key={browser}
                      onClick={() => setSelectedBrowser(browser)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedBrowser === browser
                          ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          : "border-white/10 text-[var(--color-text-secondary)] hover:bg-white/5"
                      }`}
                    >
                      {browserLabel(browser)}
                      {browser === "firefox" && (
                        <span className="ml-1 text-[10px] text-yellow-400">(推荐)</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] opacity-60 leading-relaxed">
                  在浏览器中先登录 Bilibili 即可 · Firefox 加密兼容性最佳
                  <br />或
                </p>
              </div>
            )}

            {/* Toggle to file upload */}
            {availableBrowsers.length > 0 && !useCookies && !selectedBrowser && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="ml-11 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
              >
                使用 cookies.txt 文件
              </button>
            )}

            {/* File upload area — show when no browser selected */}
            {!selectedBrowser && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleCookieFile}
                  className="hidden"
                />

                {useCookies && !cookiesFile && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCookie}
                    className="ml-11 text-xs px-3 py-1.5 rounded-lg border border-white/10
                      text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors
                      disabled:opacity-40"
                  >
                    {uploadingCookie ? "上传中…" : "选择 cookies.txt 文件"}
                  </button>
                )}
              </>
            )}

            {/* How to export guide (file upload mode only) */}
            {useCookies && !cookiesFile && !selectedBrowser && (
              <details className="ml-11 mt-1">
                <summary className="text-[11px] text-[var(--color-text-secondary)] opacity-60
                  cursor-pointer hover:opacity-100">
                  如何导出 Cookie？
                </summary>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)] leading-relaxed space-y-1">
                  <p>1. 安装浏览器扩展「Get cookies.txt」(Chrome 网上应用店)</p>
                  <p>2. 打开 Bilibili 并登录</p>
                  <p>3. 点击扩展图标 → Export 导出 cookies.txt</p>
                  <p>4. 将导出的文件上传到此处</p>
                </div>
              </details>
            )}
          </div>

          {/* Active download task */}
          {activeTask && activeTask.status !== "completed" && (
            <DownloadTaskProgress
              task={activeTask}
              onCancel={cancelDownload}
              onClear={clearTask}
            />
          )}

          {/* Parsed metadata */}
          {metadata && !activeTask && (
            <>
              {/* Cookie warning */}
              {metadata.cookieStatus === "failed" && (
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-yellow-400/90 font-medium mb-1">
                    ⚠ 未读取到登录信息
                  </p>
                  <p className="text-[11px] text-yellow-400/70">
                    {metadata.cookieWarning || "请尝试关闭浏览器后重试，或改用「导入 cookies.txt」方式"}
                  </p>
                </div>
              )}
              {metadata.cookieStatus === "ok" && (
                <div className="text-[11px] text-green-400/70 text-right -mb-3">
                  ✓ 已加载登录态
                </div>
              )}

              <VideoInfoPanel metadata={metadata} />
              <FormatSelector
                formats={metadata.formats}
                onStart={handleStartDownload}
                disabled={isProcessing}
              />
            </>
          )}

          {/* Initial state */}
          {!metadata && !activeTask && (
            <div className="text-center py-8">
              <p className="text-3xl mb-3">📥</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                粘贴视频链接开始下载
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 opacity-60">
                支持 mp4 · mp3 · 字幕 · 封面
              </p>
            </div>
          )}

          {/* Completed task summary */}
          {activeTask && activeTask.status === "completed" && (
            <DownloadTaskProgress
              task={activeTask}
              onCancel={cancelDownload}
              onClear={clearTask}
              downloadUrl={
                activeTask.outputFile
                  ? getDownloadUrl(activeTask.outputFile)
                  : undefined
              }
            />
          )}
        </div>
      ) : (
        <div className="glass rounded-3xl p-6">
          <FileList
            files={files}
            loading={filesLoading}
            onDownload={getDownloadUrl}
            onDelete={deleteFile}
            onRefresh={refreshFiles}
            onCleanup={cleanupAll}
          />
        </div>
      )}
    </div>
  );
}
