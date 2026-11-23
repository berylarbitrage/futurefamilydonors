/**
 * Copy text to the clipboard on as many browsers as possible.
 *
 * `navigator.clipboard` is missing or blocked in many phone browsers (several
 * Android vendor browsers, in-app browsers, older WebViews), so fall back to
 * the legacy `execCommand("copy")` on a hidden textarea. Returns false when
 * neither works, so the caller can ask the user to copy by hand.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  // Keep it on screen (some browsers refuse to copy off-screen text) but invisible,
  // and at 16px so iOS doesn't zoom the page.
  ta.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;";
  document.body.appendChild(ta);
  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length); // iOS Safari ignores select() on its own
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  if (previous && selection) {
    selection.removeAllRanges();
    selection.addRange(previous);
  }
  return ok;
}
