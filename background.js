var g_patterns = []
function load() {
	var str = localStorage['url_patterns']
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
		].join("\n")
	}
	g_patterns = str.split("\n")
}
load()

function save() {
	localStorage['url_patterns'] = g_patterns.join("\n")
}

var shouldInject = function(url) {
	for (var i = 0; i < g_patterns.length; i++) {
		if (url.match(g_patterns[i])) {
			return true
		}
	}
	return false
}

chrome.runtime.onMessage.addListener(
	function(msg, sender, sendResponse) {
		if (msg.set_options) {
			g_patterns = msg.options.patterns
			save()
			return
		}
		
		if (msg.get_options) {
			sendResponse({
				patterns: g_patterns
			})
			return
		}
	}
)

var doRender = function(tabId) {
	chrome.tabs.executeScript(tabId, {
		file: "cs.js"
	})
	chrome.tabs.insertCSS(tabId, {
		file: "cs.css"
	})
}

chrome.tabs.onUpdated.addListener(
	function(tabId, changeInfo, tab) {
		if (changeInfo.status == "complete") {
			if (!shouldInject(tab.url)) {
				return
			}
			
			doRender(tabId)
		}
	}
)

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(tab.id, {
		code: "typeof(g_gpv_rendered) == 'undefined'"
	}, function(res) {
		if (res[0]) {
			doRender(tab.id)
		} else {
			chrome.tabs.executeScript(tab.id, {
				code: "document.body.classList.toggle('gvcrendered')"
			})
		}
	})
})
