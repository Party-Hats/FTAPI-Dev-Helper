// Browser compatibility polyfill
if (typeof browser === "undefined") {
  var browser = chrome;
}

/**
 * Utility functions for the FTAPI Dev Helper extension
 */

/**
 * Sanitizes a Jenkins URL by removing trailing slashes and ensuring it has a protocol
 * @param {string} url - The URL to sanitize
 * @returns {string} The sanitized URL
 */
function sanitizeJenkinsUrl(url) {
  let sanitizedUrl = url.trim();

  while (sanitizedUrl.endsWith('/')) {
    sanitizedUrl = sanitizedUrl.slice(0, -1);
  }

  if (sanitizedUrl && !sanitizedUrl.match(/^https?:\/\//)) {
    sanitizedUrl = 'https://' + sanitizedUrl;
  }

  return sanitizedUrl;
}

/**
 * Preprocesses a JSON string to handle common formatting issues
 * @param {string} jsonString - The JSON string to preprocess
 * @returns {string} The preprocessed JSON string
 */
function preprocessJson(jsonString) {
  let processed = jsonString.trim();

  processed = processed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  processed = processed.replace(/'([^'\\]*(\\.[^'\\]*)*?)'/g, '"$1"');

  try {
    JSON.parse(processed);
    return processed;
  } catch (e) {
    console.log("First preprocessing attempt failed, trying more aggressive approach");

    try {
      // eslint-disable-next-line no-eval
      const obj = eval('(' + jsonString + ')');
      return JSON.stringify(obj);
    } catch (evalError) {
      console.error("Failed to preprocess JSON:", evalError);
      return processed;
    }
  }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeJenkinsUrl,
    preprocessJson
  };
}