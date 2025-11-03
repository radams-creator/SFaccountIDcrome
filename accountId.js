export const ACCOUNT_ID_PATH_REGEX = /\/(?:lightning\/r\/)?(?:Account\/)?(001[0-9A-Za-z]{12}(?:[0-9A-Za-z]{3})?)(?:[/?#]|$)/i;
export const ACCOUNT_ID_VALUE_REGEX = /(001[0-9A-Za-z]{12}(?:[0-9A-Za-z]{3})?)/i;

export function extractAccountIdFromString(candidate) {
  if (!candidate || typeof candidate !== "string") {
    return null;
  }

  const match = candidate.match(ACCOUNT_ID_VALUE_REGEX);
  return match ? match[1] : null;
}

export function safeDecode(value) {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

export function extractAccountIdFromUrl(urlString) {
  if (!urlString) {
    return null;
  }

  try {
    const url = new URL(urlString, "https://placeholder.invalid");
    const decodedPath = safeDecode(url.pathname);
    const pathMatch = decodedPath.match(ACCOUNT_ID_PATH_REGEX);
    if (pathMatch) {
      return pathMatch[1];
    }

    const decodedHash = safeDecode(url.hash ?? "");
    const hashMatch = decodedHash.match(ACCOUNT_ID_VALUE_REGEX);
    if (hashMatch) {
      return hashMatch[1];
    }

    if (url.searchParams) {
      for (const [name, value] of url.searchParams.entries()) {
        if (!value) {
          continue;
        }

        const decodedValue = safeDecode(value);
        const valueMatch = extractAccountIdFromString(decodedValue);
        if (valueMatch) {
          return valueMatch;
        }

        const lowerName = name.toLowerCase();
        if (
          lowerName.includes("record") ||
          lowerName.includes("acct") ||
          lowerName.endsWith("id") ||
          lowerName.endsWith("_id")
        ) {
          const fallbackMatch = extractAccountIdFromString(`${name}:${decodedValue}`);
          if (fallbackMatch) {
            return fallbackMatch;
          }
        }
      }
    }

    const decodedHref = safeDecode(url.href);
    const hrefMatch = decodedHref.match(ACCOUNT_ID_VALUE_REGEX);
    return hrefMatch ? hrefMatch[1] : null;
  } catch (error) {
    if (typeof console !== "undefined" && typeof console.debug === "function") {
      console.debug("Unable to parse URL", urlString, error);
    }

    return extractAccountIdFromString(urlString);
  }
}
