export function toast(message: string, type: "info" | "success" | "error" = "info") {
  window.dispatchEvent(new CustomEvent("show_toast", { detail: { message, type } }));
}
