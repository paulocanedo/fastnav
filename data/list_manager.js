/* jshint browser: true */

'use strict';

(() => {
    const resultList  = document.getElementById("result-list");
    const observer = fastnav.observer;
    const actions = fastnav.actions;

    const SELECT_NONE = 0;
    const SELECT_DOWN = 1;
    const SELECT_UP   = 2;

    var listManager = (() => {
        var currentList = [];
        var _actionSelected;
        var _selectedIndex = -1;

        observer.subscribe('selectionChanged', (what, param) => {
            updateSelection(param.oldSelectedIndex, param.selectedIndex);
        });

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
            get selectedIndex() {
                return _selectedIndex;
            },
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
                this.moveSelection(SELECT_NONE);

                currentList = [];
                resultList.innerHTML = '';

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
                let oldItem = resultList.childNodes.item(_selectedIndex);
                let oldSelectedIndex = _selectedIndex;

                if(where === SELECT_NONE) {
                    this.noSelection();
                } else if(where === SELECT_DOWN) {
                    this.moveSelectionDown();
                } else if(where === SELECT_UP) {
                    this.moveSelectionUp();
                }

                observer.fire('selectionChanged', {
                    oldSelectedIndex: oldSelectedIndex,
                    selectedIndex: _selectedIndex
                });
            },
            moveSelectionDown() {
                if(_selectedIndex + 1 < resultList.childNodes.length) {
                    _selectedIndex++;
                }
            },
            moveSelectionUp() {
                if(_selectedIndex > 0) {
                    _selectedIndex--;
                }
            },
            noSelection() {
                _selectedIndex = -1;
            }
        };
    })();

    fastnav.resultList   = resultList;
    fastnav.list_manager = listManager;
    fastnav.SELECT_NONE  = SELECT_NONE;
    fastnav.SELECT_DOWN  = SELECT_DOWN;
    fastnav.SELECT_UP    = SELECT_UP;
})();
