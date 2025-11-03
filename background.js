import { extractAccountIdFromString, extractAccountIdFromUrl } from "./accountId.js";

const CONTEXT_MENU_ID = "copy-salesforce-record-id";

function createContextMenu() {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Copy Salesforce Record ID",
    contexts: ["link", "page", "selection"],
    documentUrlPatterns: ["https://*.lightning.force.com/*"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to create context menu:", chrome.runtime.lastError.message);
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(createContextMenu);
});

chrome.runtime.onStartup?.addListener(() => {
  chrome.contextMenus.removeAll(createContextMenu);
});

function findAccountId(candidate) {
  if (!candidate) {
    return null;
  }

  const fromUrl = extractAccountIdFromUrl(candidate);
  if (fromUrl) {
    return fromUrl;
  }

  return extractAccountIdFromString(candidate);
}

async function copyTextToClipboard(tabId, text) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (value) => {
        try {
          await navigator.clipboard.writeText(value);
          return { success: true };
        } catch (err) {
          return { success: false, message: err.message };
        }
      },
      args: [text]
    });

    return result?.result ?? { success: false, message: "Unknown error" };
  } catch (error) {
    console.error("Scripting injection failed", error);
    return { success: false, message: error?.message ?? "Scripting failed" };
  }
}

function showToast(tabId, message, isError = false) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (text, error) => {
      const isError = Boolean(error);
      if (!document || !document.body) {
        return;
      }

      const existing = document.getElementById("sf-account-id-toast");
      if (existing) {
        existing.remove();
      }

      const toast = document.createElement("div");
      toast.id = "sf-account-id-toast";
      toast.textContent = text;
      toast.style.position = "fixed";
      toast.style.bottom = "24px";
      toast.style.right = "24px";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "6px";
      toast.style.fontFamily = "Arial, sans-serif";
      toast.style.fontSize = "14px";
      toast.style.color = "#fff";
      toast.style.backgroundColor = isError ? "#c23934" : "#0070d2";
      toast.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.2)";
      toast.style.zIndex = 2147483647;
      toast.style.pointerEvents = "none";
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.transition = "opacity 150ms ease-out";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 200);
      }, 1800);
    },
    args: [message, isError]
  }, () => chrome.runtime.lastError && console.error(chrome.runtime.lastError));
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  const candidates = [info.linkUrl, info.pageUrl, info.selectionText, tab.url];
  const accountId = candidates.map(findAccountId).find(Boolean);

  if (!accountId) {
    showToast(tab.id, "No Salesforce Record ID found", true);
    return;
  }

  copyTextToClipboard(tab.id, accountId)
    .then((result) => {
      if (result.success) {
        showToast(tab.id, `Copied Record ID: ${accountId}`);
      } else {
        console.error("Failed to copy record ID:", result.message);
        showToast(tab.id, "Unable to copy Record ID", true);
      }
    })
    .catch((error) => {
      console.error("Unexpected error copying record ID", error);
      showToast(tab.id, "Unable to copy Record ID", true);
    });
});
