/* jshint browser: true */

'use strict';

(() => {
    const resultList  = document.getElementById("result-list");
    const actions = fastnav.actions;

    const SELECT_NONE = 0;
    const SELECT_DOWN = 1;
    const SELECT_UP   = 2;

    var listManager = (() => {
        var currentList = [];
        var _actionSelected;

        var selectedIndex = -1;

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
                        let url = action.url;

                        if(search === '*all*' || title.indexOf(search) >= 0 ||
                           (url && url.toLowerCase().indexOf(search) >= 0)) {
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

    fastnav.list_manager = listManager;
    fastnav.SELECT_NONE  = SELECT_NONE;
    fastnav.SELECT_DOWN  = SELECT_DOWN;
    fastnav.SELECT_UP    = SELECT_UP;
})();
