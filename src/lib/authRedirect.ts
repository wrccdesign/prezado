const KEY = "honorifico:post-auth-redirect";

/** Aceita apenas caminhos internos (same-origin), evitando open redirect. */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export function setPendingRedirect(path: string) {
  if (!isSafeInternalPath(path) || path === "/") return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* storage indisponível */
  }
}

export function consumePendingRedirect(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (value) sessionStorage.removeItem(KEY);
    return isSafeInternalPath(value) ? value : null;
  } catch {
    return null;
  }
}
