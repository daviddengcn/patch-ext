var g_patterns = [];
(() => {
  chrome.storage.local.get(['url_patterns']).then((localStorage) => {
    var str = localStorage['url_patterns'];
    if (!str) {
      str = [
        "https://issues[.]apache[.]org/jira/secure/attachment/[^/]*/.*[.]patch",
	"https://issues[.]apache[.]org/jira/secure/attachment/[^/]*/.*[.]txt",
	"https://github.com/[^/]*/[^/]*/commit/[^/]*[.]patch",
	"https://github.com/[^/]*/[^/]*/commit/[^/]*[.]diff",
	"https://gitlab.com/[^/]*/[^/]*/commit/[^/]*[.]patch",
	"https://gitlab.com/[^/]*/[^/]*/commit/[^/]*[.]diff",
	"https://patch-diff.githubusercontent.com/raw/.*[.]patch",
	"https://patch-diff.githubusercontent.com/raw/.*[.]diff"
      ].join("\n");
    }
    g_patterns = str.split("\n");
  });
})();

function save() {
  return chrome.storage.local.set({
    'url_patterns': g_patterns.join("\n")
  });
}

function shouldInject(url) {
  if (!url) {
    return false;
  }
  for (const pattern of g_patterns) {
    if (url.match(pattern)) {
      return true;
    }
  }
  return false;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.set_options) {
    g_patterns = msg.options.patterns;
    save();
    return;
  }
  if (msg.get_options) {
    sendResponse({ patterns: g_patterns });
    return;
  }
});

var doRender = function(tab) {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['cs.js']
  });
  chrome.scripting.insertCSS({
    target: {tabId: tab.id},
    files: ['cs.css']
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status == "complete") {
    if (shouldInject(tab.url)) {
      doRender(tab);
    }
  }
});

chrome.action.onClicked.addListener(function(tab) {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => {
      return typeof(g_gpv_rendered) != 'undefined';
    }
  })
  .then(res => {
    if (res[0].result) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => {
          document.body.classList.toggle('gvcrendered');
        }
      });
    } else {
      doRender(tab);
    }
  });
});
