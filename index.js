/* jshint esnext: true */

'use strict';

const metadata  = require('./package.json');
const tabs      = require('sdk/tabs');
const action    = require('sdk/ui/button/action');
const history   = require("sdk/places/history");
const bookmarks = require("sdk/places/bookmarks");
const system    = require("sdk/system");
const { data }  = require("sdk/self");
const { getFavicon } = require("sdk/places/favicon");

var resultPanel = null;
var aboutPanel = null;

tabs.on('ready', (tab) => {
    resultPanel.port.emit('tab-ready', {
        tabId: tab.id,
        title: tab.title,
        url:   tab.url
    });

    getFavicon(tab).then((url) => {
        resultPanel.port.emit('tab-favicon-ready', {tabId: tab.id, faviconUrl: url});
    });
});

tabs.on('open', (tab) => {
    resultPanel.port.emit('tab-opened', {
        tabId: tab.id,
        title: tab.title,
        url:   tab.url
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
      data.url("module.js"),
      data.url("actions.js"),
      data.url("list_manager.js"),
      data.url("listeners.js"),
      data.url("events.js"),
      data.url("init.js"),
  ],
  contentStyleFile: [
      data.url("style/fastnav.css"),
      data.url("style/font-awesome.min.css")
  ]
});

aboutPanel = require("sdk/panel").Panel({
  width:  720,
  height: 450,
  contentURL: data.url("about.html"),
  contentScriptFile: data.url("about.js"),
  // contentStyleFile: data.url("style/fastnav.css")
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

resultPanel.on('show', () => resultPanel.port.emit('show'));
aboutPanel.port.emit('metadata', metadata);

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

resultPanel.port.on('action-performed', (action, text) => {
    let { id, command, url } = action;
    switch (command) {
        case 'cmd_default':
            tabs.activeTab.url = text;
            break;
        case 'cmd_newtab':
            tabs.open('about:newtab');
            break;
        case 'cmd_new-window':
            tabs.open({url: 'about:newtab', inNewWindow: true});
            break;
        case 'cmd_open':
            tabs.open(url);
            break;
        case 'cmd_open-pref':
            tabs.open('about:preferences');
            break;
        case 'cmd_addons':
            tabs.open('about:addons');
            break;
        case 'cmd_downloads':
            tabs.open('about:downloads');
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
        case 'cmd_show-about':
            aboutPanel.show();
            break;
        case 'cmd_ffsync':
            tabs.open('about:accounts');
            break;
        case 'cmd_custom-ui':
            tabs.open('about:customizing');
            break;
        case 'cmd_home':
            tabs.open('about:home');
            break;
        case 'cmd_permissions':
            tabs.open('about:permissions');
            break;
        case 'cmd_plugins':
            tabs.open('about:plugins');
            break;
        case 'cmd_ff-support':
            tabs.open('about:support');
            break;

        default:
    }

    if(command === 'cmd_exit') {
        system.exit();
    } else {
        resultPanel.hide();
    }
});
