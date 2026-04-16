import { renderToStaticMarkup } from "react-dom/server";

export function renderMarkup(element) {
  return renderToStaticMarkup(element);
}
