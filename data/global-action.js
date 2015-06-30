/* jshint browser: true */

'use strict';

const SELECT_NONE = 0;
const SELECT_DOWN = 1;
const SELECT_UP   = 2;

const searchField = document.getElementById("search-field");

var actions = new Map();

var createAction = (command, title, description, type = 'normal', icon = 'circle-thin') => {
    var _command = command;
    var _title = title;
    var _description = description;
    var _type = type;
    var _icon = icon;
    var _url = '';
    var _tabId = '';
    var _favicon = '';
    var _selected = false;

    var domCreated = false;
    var elements = {};

    let getClassNameFromLi = (selected) => {
        let className = this.type;

        if(selected) {
            className += ' selected';
        }

        return className;
    };

    let getClassNameFromIcon = (icon) => {
        let prefix = 'ga-icon fa fa-';
        return prefix + icon;
    };

    let getClassName = (what, _action) => {
        if(what === 'li') {
            return getClassNameFromLi(_action.selected);
        } else if(what === 'icon') {
            return getClassNameFromIcon(_action.icon);
        }
    };

    let getTextNonNull = (variable, defaultValue) => {
        return (variable && variable.length > 0) ? variable.toString() : defaultValue;
    };

    return {
        get command() { return _command; },
        get title() { return _title; },
        get description() { return _description; },
        get type() { return _type; },
        get icon() { return _icon; },
        get url() { return _url; },
        get tabId() { return _tabId; },
        get favicon() { return _favicon; },
        get selected() { return _selected; },

        get dom() { return elements.li; },

        set title(title) { _title = title; },
        set description(description) { _description = description; },
        set url(url) { _url = url; },
        set tabId(tabId) { _tabId = tabId; },
        set favicon(favicon) { _favicon = favicon; },
        set selected(selected) { _selected = selected; },

        createDOM() {
            elements = {};

            elements.li = document.createElement('li');
            elements.icon = document.createElement('i');
            elements.divMain = document.createElement('div');
            elements.h1Title = document.createElement('h1');
            elements.textTitle = document.createTextNode(this.title);
            elements.h2Description = document.createElement('h2');
            elements.textDescription = document.createTextNode('description');

            elements.divMain.appendChild(elements.h1Title);
            elements.h1Title.appendChild(elements.textTitle);
            elements.divMain.appendChild(elements.h2Description);
            elements.h2Description.appendChild(elements.textDescription);
            elements.li.appendChild(elements.icon);
            elements.li.appendChild(elements.divMain);

            elements.divMain.className = 'ga-li-main';
            elements.li.addEventListener('click', evt => {
                self.port.emit('action-performed', this, searchField.value);
            });
            elements.li.setAttribute('global-action-id', this.id);

            domCreated = true;
            return elements.li;
        },

        refreshDOM() {
            if(!domCreated) {
                this.createDOM();
            }

            elements.li.className   = getClassName('li', this);
            elements.icon.className = getClassName('icon', this);
            elements.textTitle.nodeValue = getTextNonNull(this.title, `No title`);
            elements.textDescription.nodeValue = getTextNonNull(this.description, `***`);
            elements.divMain.style.backgroundImage = `url('${this.favicon}')`;

            return elements.li;
        },

        toString() {
            return `(${this.command}) ${this.title}`;
        }
    };
};

var listManager = (() => {
    var currentList = [];
    var _actionSelected;

    var selectedIndex = -1;
    const resultList  = document.getElementById("result-list");

    var updateSelection = (oldSelectedIndex, selectedIndex) => {
        if(oldSelectedIndex >= 0) {
            let oldAction = currentList[oldSelectedIndex];
            oldAction.selected = false;
            oldAction.refreshDOM();
        }

        if(selectedIndex >= 0) {
            _actionSelected = currentList[selectedIndex];
            _actionSelected.selected = true;
            let dom = _actionSelected.refreshDOM();
            dom.scrollIntoView(false);
        }
    };

    return {
        get actionSelected() {
            return _actionSelected;
        },
        set actionSelected(actionSelected) {
            _actionSelected = actionSelected;
        },
        actionFiltered(action) {
            currentList.push(action);
            resultList.appendChild(action.refreshDOM());
        },
        update(search = '*all*') {
            currentList = [];
            resultList.innerHTML = '';
            this.moveSelection(SELECT_NONE);

            if(search.length > 0 && search !== '*all*') {
                let action = actions.get('default');
                action.description = `Open ${search}`;
                this.actionFiltered(action);
            }

            let filterActions = (search, collection) => {
                for(let action of collection) {
                    let title = action.title.toLowerCase();

                    if(search === '*all*' || title.indexOf(search) >= 0) {
                        this.actionFiltered(action);
                    }
                }
            };

            filterActions(search, actions.get('cache'));
            filterActions(search, actions.get('tabs'));

            if(search.length > 0) {
                self.port.emit('get-bookmarks', search);
                self.port.emit('get-history', search);
            }
        },
        remove(dom) {
            //todo
        },
        moveSelection(where) {
            let oldItem = resultList.childNodes.item(selectedIndex);
            let oldSelectedIndex = selectedIndex;

            if(where === SELECT_NONE) {
                this.noSelection();
            } else if(where === SELECT_DOWN) {
                this.moveSelectionDown();
            } else if(where === SELECT_UP) {
                this.moveSelectionUp();
            }

            updateSelection(oldSelectedIndex, selectedIndex);
        },
        moveSelectionDown() {
            if(selectedIndex + 1 < resultList.childNodes.length) {
                selectedIndex++;
            }
        },
        moveSelectionUp() {
            if(selectedIndex > 0) {
                selectedIndex--;
            }
        },
        noSelection() {
            selectedIndex = -1;
        }
    };
})();

//initalize
(() => {
    let findAction = (key, where) => {
        return what => {
            let collection = actions.get(where);

            for(let elem of collection) {
                if(elem[key] === what) {
                    return elem;
                }
            }
            return null;
        };
    };
    actions.set('default', createAction('cmd_default', 'Open', 'description', 'normal', 'globe'));
    actions.set('tabs', new Set());
    actions.set('cache', []);
    actions.set('findByTabId',   findAction('tabId', 'tabs'));
    actions.set('findByCommand', findAction('command', 'cache'));

    self.port.on('get-history-ready', results => {
        results.forEach(elem => {
            let action = createAction('cmd_open', elem.title, elem.url, 'history', 'history');
            action.url = elem.url;

            listManager.actionFiltered(action);
        });
    });

    self.port.on('get-bookmarks-ready', results => {
        results.forEach(elem => {
            let action = createAction('cmd_open', elem.title, elem.url, 'bookmark', 'bookmark');
            action.url = elem.url;

            listManager.actionFiltered(action);
        });
    });

    self.port.on('show', () => {
        searchField.value = '';
        searchField.focus();

        listManager.update();
    });

    let movementKeys = [
        KeyEvent.DOM_VK_UP,
        KeyEvent.DOM_VK_DOWN,
        KeyEvent.DOM_VK_LEFT,
        KeyEvent.DOM_VK_RIGHT
    ];
    searchField.addEventListener('keyup', evt => {
        let text = evt.target.value;

        if(evt.keyCode === KeyEvent.DOM_VK_RETURN) {
            self.port.emit('action-performed', listManager.actionSelected, text);
        } else if(movementKeys.indexOf(evt.keyCode) < 0) {
            listManager.update(text);
        }
    });

    searchField.addEventListener('keypress', evt => {
        if(evt.keyCode === KeyEvent.DOM_VK_UP) {
            listManager.moveSelection(SELECT_UP);
        } else if(evt.keyCode === KeyEvent.DOM_VK_DOWN) {
            listManager.moveSelection(SELECT_DOWN);
        }
    });

    self.port.on('tab-opened', (elem) => {
        let action = createAction('cmd_activate', elem.title, elem.description, 'tab', 'angle-double-right');
        action.tabId = elem.tabId;

        let tabs = actions.get('tabs');
        tabs.add(action);
        listManager.actionFiltered(action);
    });

    self.port.on('tab-closed', (elem) => {
        let action = actions.get('findByTabId')(elem.tabId);
        let tabs = actions.get('tabs');

        tabs.delete(action);
    });

    self.port.on('tab-ready', (elem) => {
        let action = actions.get('findByTabId')(elem.tabId);

        action.title = elem.title;
        action.description = elem.description;
        action.url = elem.url;
        action.refreshDOM();
    });

    self.port.on('tab-favicon-ready', (elem) => {
        let action = actions.get('findByTabId')(elem.tabId);

        action.favicon = elem.faviconUrl;
        action.refreshDOM();
    });

    let actionsCache = actions.get('cache');

    actionsCache.push(createAction('cmd_newtab',      `New Tab`, `Open a New Tab`, 'normal', 'plus'));
    actionsCache.push(createAction('cmd_close-tab',   `Close Tab`, `Close Current Tab`, 'normal', 'times'));
    actionsCache.push(createAction('cmd_open-pref',   `Preferences`, `Open Preferences Tab`, 'normal', 'cog'));
    actionsCache.push(createAction('cmd_go-back',     `Go Back`, `Go to Back Location`, 'normal', 'arrow-left'));
    actionsCache.push(createAction('cmd_go-forward',  `Go Forward`, `Go to Forward Location`, 'normal', 'arrow-right'));

    // actions.set('cache', actionsCache);
    // action(genId(), 'cmd_open-window', `New Window`, `Open a New Window`, 'normal', 'external-link-square');
    // action(genId(), 'cmd_zoom-in',  `Zoom in`, 'normal');
    // action(genId(), 'cmd_zoom-out',  `Zoom out`, 'normal');
})();

// (() => {
//     var count = 0;
//     var a = action('teste'+(++count), 'cmd_test', 'title'+count, 'custom');
//     var b = action('teste'+(++count), 'cmd_test', 'title'+count);
//     var c = action('teste'+1);
//     var d = action('teste'+1, '000', '111', 'zzz');
//
//     console.log('custom', a.type);
//     console.log('title1', a.title);
//     console.log('title1', c.title);
//     console.log('normal', b.type);
//     console.log('custom', d.type);
//
//     console.log(2, actions.size);
// })();
