'use strict';

(() => {
    const actions = fastnav.actions;
    const createAction = fastnav.createAction;
    const listManager = fastnav.list_manager;
    const searchField = fastnav.searchField;

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
})();
