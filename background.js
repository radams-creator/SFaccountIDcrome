const CONTEXT_MENU_ID = "copy-salesforce-account-id";
const ACCOUNT_ID_REGEX = /\/Account\/([0-9A-Za-z]{15,18})(?:\/|$)/;

function createContextMenu() {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Copy Salesforce Account ID",
    contexts: ["link", "page"],
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

function extractAccountId(urlString) {
  if (!urlString) {
    return null;
  }

  try {
    const url = new URL(urlString);
    const match = url.pathname.match(ACCOUNT_ID_REGEX);
    return match ? match[1] : null;
  } catch (error) {
    console.debug("Unable to parse URL", urlString, error);
    return null;
  }
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

  const candidateUrl = info.linkUrl || info.pageUrl || tab.url;
  const accountId = extractAccountId(candidateUrl);

  if (!accountId) {
    showToast(tab.id, "No Salesforce Account ID found", true);
    return;
  }

  copyTextToClipboard(tab.id, accountId)
    .then((result) => {
      if (result.success) {
        showToast(tab.id, `Copied Account ID: ${accountId}`);
      } else {
        console.error("Failed to copy account ID:", result.message);
        showToast(tab.id, "Unable to copy Account ID", true);
      }
    })
    .catch((error) => {
      console.error("Unexpected error copying account ID", error);
      showToast(tab.id, "Unable to copy Account ID", true);
    });
});
