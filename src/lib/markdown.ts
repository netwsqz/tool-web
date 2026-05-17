import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

let marked: Marked | null = null;

function getMarked(): Marked {
  if (!marked) {
    marked = new Marked(
      markedHighlight({
        emptyLangClass: "hljs",
        highlight(code: string, lang: string) {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        },
      })
    );
    marked.setOptions({ gfm: true });
  }
  return marked;
}

export function renderMarkdown(content: string): string {
  const result = getMarked().parse(content);
  return typeof result === "string" ? result : "";
}
