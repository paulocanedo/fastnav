/* jshint browser: true */

'use strict';

(() => {
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

    fastnav.actions = actions;
    fastnav.searchField = searchField;
    fastnav.createAction = createAction;
})();
