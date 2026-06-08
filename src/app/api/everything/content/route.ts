import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TEXT_EXTENSIONS = new Set([
  "txt", "json", "js", "ts", "jsx", "tsx",
  "css", "scss", "html", "xml", "yaml", "yml",
  "sh", "bat", "ps1", "env", "cfg", "ini", "log",
  "py", "rb", "java", "go", "rs", "c", "cpp", "h",
  "sql", "php", "swift", "kt", "dart", "toml", "md",
]);

// 允许读取的目录白名单（仅限用户数据目录）
const ALLOWED_ROOTS = [
  path.resolve(process.cwd(), "data"),
  path.resolve(process.cwd(), "public", "uploads"),
];

function isPathAllowed(filepath: string): boolean {
  const resolved = path.resolve(filepath);
  return ALLOWED_ROOTS.some((root) => {
    const relative = path.relative(root, resolved);
    return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
  });
}

export async function GET(request: NextRequest) {
  try {
    const filepath = request.nextUrl.searchParams.get("filepath");
    if (!filepath) {
      return NextResponse.json({ error: "缺少 filepath 参数" }, { status: 400 });
    }

    if (!isPathAllowed(filepath)) {
      return NextResponse.json({ error: "不允许访问该路径" }, { status: 403 });
    }

    const resolved = path.resolve(filepath);

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    const stat = fs.statSync(resolved);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "不是有效的文件" }, { status: 400 });
    }

    const ext = path.extname(resolved).toLowerCase().replace(".", "");
    if (!TEXT_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "不支持预览该文件类型" }, { status: 400 });
    }

    // 限制文件大小（最大 5MB）
    if (stat.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大" }, { status: 400 });
    }

    const content = fs.readFileSync(resolved, "utf-8");
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取文件失败" },
      { status: 500 }
    );
  }
}
