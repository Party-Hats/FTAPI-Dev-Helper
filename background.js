// Main background script that imports all other background scripts
if (typeof browser === "undefined") {
  var browser = chrome;
}

// Import the SecuTransferErrorPage background script
importScripts('SecuTransferErrorPage/background.js');

// Import the AutoCloseTab background script
importScripts('AutoCloseTab/autoClose.js');