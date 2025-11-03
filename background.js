const CONTEXT_MENU_ID = "copy-salesforce-account-id";
const ACCOUNT_ID_PATH_REGEX = /\/(?:lightning\/r\/)?(?:Account\/)?(001[0-9A-Za-z]{12}(?:[0-9A-Za-z]{3})?)(?:[/?#]|$)/;
const ACCOUNT_ID_VALUE_REGEX = /(001[0-9A-Za-z]{12}(?:[0-9A-Za-z]{3})?)/;

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

function extractAccountIdFromString(candidate) {
  if (!candidate || typeof candidate !== "string") {
    return null;
  }

  const match = candidate.match(ACCOUNT_ID_VALUE_REGEX);
  return match ? match[1] : null;
}

function extractAccountIdFromUrl(urlString) {
  if (!urlString) {
    return null;
  }

  try {
    const url = new URL(urlString);
    const pathMatch = url.pathname.match(ACCOUNT_ID_PATH_REGEX);
    if (pathMatch) {
      return pathMatch[1];
    }

    const hashMatch = url.hash?.match(ACCOUNT_ID_VALUE_REGEX);
    if (hashMatch) {
      return hashMatch[1];
    }

    const hrefMatch = url.href.match(ACCOUNT_ID_VALUE_REGEX);
    return hrefMatch ? hrefMatch[1] : null;
  } catch (error) {
    console.debug("Unable to parse URL", urlString, error);
    return extractAccountIdFromString(urlString);
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

async function resolveAccountIdFromElement(tabId, targetElementId, frameId) {
  if (!tabId || !targetElementId) {
    return null;
  }

  try {
    const target = { tabId, elementIds: [targetElementId] };
    if (typeof frameId === "number") {
      target.frameIds = [frameId];
    }

    const [result] = await chrome.scripting.executeScript({
      target,
      func: (element, regexSource) => {
        const pattern = new RegExp(regexSource, "i");

        const getAttributeValues = (node) => {
          if (!node || typeof node.getAttribute !== "function") {
            return [];
          }

          const names = typeof node.getAttributeNames === "function" ? node.getAttributeNames() : [];
          return names.map((name) => node.getAttribute(name)).filter((value) => typeof value === "string");
        };

        const tryMatchCollection = (values) => {
          for (const value of values) {
            if (typeof value !== "string") {
              continue;
            }
            const match = value.match(pattern);
            if (match) {
              return match[0];
            }
          }
          return null;
        };

        const checkNode = (node, depth = 0) => {
          if (!node || depth > 10) {
            return null;
          }

          const datasetValues = node.dataset ? Object.values(node.dataset) : [];
          const attributeValues = getAttributeValues(node);
          const propertyValues = [];

          if (typeof node.href === "string") {
            propertyValues.push(node.href);
          }
          if (typeof node.value === "string") {
            propertyValues.push(node.value);
          }
          if (typeof node.title === "string") {
            propertyValues.push(node.title);
          }
          if (typeof node.ariaLabel === "string") {
            propertyValues.push(node.ariaLabel);
          }

          const textMatch = node.textContent ? node.textContent.match(pattern) : null;
          if (textMatch) {
            return textMatch[0];
          }

          const matchFromData =
            tryMatchCollection(datasetValues) ||
            tryMatchCollection(attributeValues) ||
            tryMatchCollection(propertyValues);
          if (matchFromData) {
            return matchFromData;
          }

          return checkNode(node.parentElement, depth + 1);
        };

        return checkNode(element);
      },
      args: [ACCOUNT_ID_VALUE_REGEX.source]
    });

    return result?.result ?? null;
  } catch (error) {
    console.debug("Failed to resolve Account ID from element", error);
    return null;
  }
}

async function resolveAccountIdFromPage(tabId, frameId) {
  if (!tabId) {
    return null;
  }

  try {
    const target = { tabId };
    if (typeof frameId === "number") {
      target.frameIds = [frameId];
    }

    const [result] = await chrome.scripting.executeScript({
      target,
      func: (regexSource) => {
        const pattern = new RegExp(regexSource, "i");

        const tryMatch = (value) => {
          if (typeof value !== "string") {
            return null;
          }
          const match = value.match(pattern);
          return match ? match[0] : null;
        };

        const searchNodeForMatch = (node, seen = new Set(), depth = 0) => {
          if (!node || seen.has(node) || depth > 2000) {
            return null;
          }
          seen.add(node);

          const datasetValues = node.dataset ? Object.values(node.dataset) : [];
          for (const value of datasetValues) {
            const match = tryMatch(value);
            if (match) {
              return match;
            }
          }

          if (typeof node.getAttributeNames === "function") {
            for (const name of node.getAttributeNames()) {
              const match = tryMatch(node.getAttribute(name));
              if (match) {
                return match;
              }
            }
          }

          const propertiesToCheck = [node.href, node.value, node.title, node.ariaLabel, node.textContent];
          for (const property of propertiesToCheck) {
            const match = tryMatch(property);
            if (match) {
              return match;
            }
          }

          if (node.children && node.children.length) {
            for (const child of Array.from(node.children)) {
              const match = searchNodeForMatch(child, seen, depth + 1);
              if (match) {
                return match;
              }
            }
          }

          return null;
        };

        const hrefMatch = tryMatch(window.location?.href) || tryMatch(window.location?.hash);
        if (hrefMatch) {
          return hrefMatch;
        }

        const meta = document.querySelector('meta[name="sfdc-recordid"], meta[name="recordId"]');
        const metaMatch = tryMatch(meta?.getAttribute("content"));
        if (metaMatch) {
          return metaMatch;
        }

        const preferredSelectors = [
          '[data-recordid]',
          '[data-record-id]',
          '[data-recordId]',
          '[data-id]',
          '[data-target-selection-name]',
          'a[href*="/Account/001"]'
        ];

        for (const selector of preferredSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const match = searchNodeForMatch(element);
            if (match) {
              return match;
            }
          }
        }

        return searchNodeForMatch(document.body ?? null);
      },
      args: [ACCOUNT_ID_VALUE_REGEX.source]
    });

    return result?.result ?? null;
  } catch (error) {
    console.debug("Failed to resolve Account ID from page", error);
    return null;
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  const tabId = tab.id;
  const sources = [info.linkUrl, info.pageUrl, tab.url];
  let accountId = null;

  for (const source of sources) {
    accountId = extractAccountIdFromUrl(source) || extractAccountIdFromString(source);
    if (accountId) {
      break;
    }
  }

  if (!accountId && info.selectionText) {
    accountId = extractAccountIdFromString(info.selectionText);
  }

  if (!accountId && info.targetElementId) {
    accountId = await resolveAccountIdFromElement(tabId, info.targetElementId, info.frameId);
  }

  if (!accountId) {
    accountId = await resolveAccountIdFromPage(tabId, info.frameId);
  }

  if (!accountId) {
    showToast(tabId, "No Salesforce Account ID found", true);
    return;
  }

  copyTextToClipboard(tabId, accountId)
    .then((result) => {
      if (result.success) {
        showToast(tabId, `Copied Account ID: ${accountId}`);
      } else {
        console.error("Failed to copy account ID:", result.message);
        showToast(tabId, "Unable to copy Account ID", true);
      }
    })
    .catch((error) => {
      console.error("Unexpected error copying account ID", error);
      showToast(tabId, "Unable to copy Account ID", true);
    });
});
