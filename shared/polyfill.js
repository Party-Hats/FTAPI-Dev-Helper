// If "browser" isn't defined (Chrome), we map it to "chrome"
// so we can call `browser.*`.
if (typeof browser === "undefined") {
  var browser = chrome;
}
