function ut(id, text) {
	document.getElementById(id).innerText = text;
}

ut('span-page-title', 'Git Patch Viewer ' + chrome.app.getDetails().version);

function send_options() {
	var patterns = document.getElementById('ta-patterns').value.trim().split("\n")
	chrome.runtime.sendMessage({
		set_options:{},
		options: {
			patterns: patterns
		}
	})
}

function load() {
	chrome.runtime.sendMessage({get_options:{}}, function(opt) {
		console.log(JSON.stringify(opt))
		document.getElementById('ta-patterns').value = opt.patterns.join("\n")
		
		document.getElementById('ta-patterns').addEventListener('change', function(e) {
			send_options()
		});
	})
	
}

load()
