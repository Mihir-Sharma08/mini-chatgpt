import { isValidElement } from "react";

export function getTextContent(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join("");
  if (isValidElement(node)) return getTextContent(node.props.children);
  return "";
}