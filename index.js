/* jshint esnext: true */

'use strict';

(() => {

const tabs           = require('sdk/tabs');
const action         = require('sdk/ui/button/action');
const history        = require("sdk/places/history");
const bookmarks      = require("sdk/places/bookmarks");
const { data }       = require("sdk/self");
const { getFavicon } = require("sdk/places/favicon");

var resultPanel = null;

tabs.on('ready', (tab) => {
    resultPanel.port.emit('tab-ready', {
        tabId: tab.id,
        title: tab.title,
        description: tab.url
    });

    getFavicon(tab).then((url) => {
        resultPanel.port.emit('tab-favicon-ready', {tabId: tab.id, faviconUrl: url});
    });
});

tabs.on('open', (tab) => {
    resultPanel.port.emit('tab-opened', {
        tabId: tab.id,
        title: tab.title,
        description: tab.url
    });
});

tabs.on('close', (tab) => {
    resultPanel.port.emit('tab-closed', { tabId: tab.id });
});

//panel to show search results
resultPanel = require("sdk/panel").Panel({
  width:  720,
  height: 450,
  contentURL: data.url("main.html"),
  contentScriptFile: [
      data.url("global-action.js"),
      data.url("events.js")
  ],
  contentStyleFile: data.url("style/global-action.less")
});

//button to start add-on
action.ActionButton({
  id: "global-action",
  label: "Show Fast Navigation Panel (Ctrl+Shift+Space)",
  icon: {
    "16": "./images/icon-16.png",
    "32": "./images/icon-32.png",
    "64": "./images/icon-64.png"
  },
  onClick: state => resultPanel.show()
});

var showHotKey = require("sdk/hotkeys").Hotkey({
  combo: "accel-shift-space",
  onPress: function() {
      if(resultPanel.isShowing) {
          resultPanel.hide();
      } else {
          resultPanel.show();
      }
  }
});

for(let tab of tabs) {
    resultPanel.port.emit('tab-opened', {
        title: tab.title,
        description: tab.url,
        tabId: tab.id
    });
}


resultPanel.port.on('get-history', text => {
    history.search(
      { query: text },
      { sort:  "date", count: 50 }
    ).on("end", function (results) {
        resultPanel.port.emit('get-history-ready', results);
    });
});

resultPanel.port.on('get-bookmarks', text => {
    bookmarks.search(
      { query: text },
      { sort:  "title" }
    ).on("end", function (results) {
        resultPanel.port.emit('get-bookmarks-ready', results);
    });
});

resultPanel.on('show', () => resultPanel.port.emit('show'));

resultPanel.port.on('action-performed', (action, text) => {
    let { id, command, url } = action;
    switch (command) {
        case 'cmd_default':
            tabs.activeTab.url = text;
            break;
        case 'cmd_newtab':
            tabs.open('about:newtab');
            break;
        case 'cmd_open':
            tabs.open(url);
            break;
        case 'cmd_open-pref':
            tabs.open('about:preferences');
            break;
        case 'cmd_close-tab':
            tabs.activeTab.close();
            break;
        case 'cmd_go-back':
            tabs.activeTab.attach({ contentScript: 'window.history.back();' });
            break;
        case 'cmd_go-forward':
            tabs.activeTab.attach({ contentScript: 'window.history.forward();' });
            break;
        case 'cmd_activate':
            for(let tab of tabs) {
                if(tab.id === action.tabId) {
                    tab.activate();
                }
            }
            break;
        default:

    }
    resultPanel.hide();
});

})();
