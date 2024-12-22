function ut(id, text) {
  document.getElementById(id).innerText = text;
}

ut('span-page-title', 'Git Patch Viewer ' + chrome.runtime.getManifest().version);

function send_options() {
  let patterns = document.getElementById('ta-patterns').value.trim().split("\n");
  chrome.runtime.sendMessage({
    set_options: {},
    options: { patterns: patterns }
  });
}

function load() {
  chrome.runtime.sendMessage({get_options: {}}, opt => {
    document.getElementById('ta-patterns').value = opt.patterns.join("\n");
    document.getElementById('ta-patterns').addEventListener('change', () => {
      send_options();
    });
  });	
}
load()
