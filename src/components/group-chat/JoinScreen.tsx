"use client";

interface Props {
  nickname: string;
  onNicknameChange: (v: string) => void;
  serverAddress: string;
  onServerAddressChange: (v: string) => void;
  onConnect: (hostname?: string) => void;
  onError: () => void;
}

export function JoinScreen({
  nickname, onNicknameChange,
  serverAddress, onServerAddressChange,
  onConnect, onError,
}: Props) {
  const handleConnect = () => {
    if (!nickname.trim()) {
      onError();
      return;
    }
    if (serverAddress.trim()) {
      onConnect(serverAddress.trim());
    } else {
      onConnect();
    }
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 max-w-md mx-auto mt-8">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">💬</div>
        <h2 className="text-lg font-semibold mb-1">局域网群聊</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          同一局域网内实时沟通 · 文件分享
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
            你的昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="输入昵称"
            maxLength={10}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10
              text-sm text-white placeholder-[var(--color-text-secondary)]
              focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
            服务器地址
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverAddress}
              onChange={(e) => onServerAddressChange(e.target.value)}
              placeholder="默认自动检测 (留空即可)"
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10
                text-sm text-white placeholder-[var(--color-text-secondary)]
                focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
            <button
              type="button"
              disabled={!nickname.trim()}
              className="px-5 py-2 rounded-xl text-sm font-medium
                bg-[var(--color-accent)] text-white
                hover:opacity-90 transition-opacity
                disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              onClick={handleConnect}
            >
              连接
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-secondary)] text-center">
        请先启动聊天服务器: npm run chat-server
      </p>
    </div>
  );
}
