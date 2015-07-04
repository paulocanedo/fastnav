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
          // param.scrollNeeded
            // updateSelection(param.oldSelectedIndex, param.selectedIndex);
            let oldSelectedIndex = param.oldSelectedIndex;
            let selectedIndex = param.selectedIndex;
            let scrollNeeded = param.scrollNeeded;

            if(oldSelectedIndex >= 0) {
                let oldAction = currentList[oldSelectedIndex];
                oldAction.selected = false;
                oldAction.refreshDOM();
            }

            if(selectedIndex >= 0) {
                _actionSelected = currentList[selectedIndex];
                _actionSelected.selected = true;
                let dom = _actionSelected.refreshDOM();

                if(scrollNeeded) {
                  dom.scrollIntoView(false);
                }
            }
            _selectedIndex = selectedIndex;
        });

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
                action.listIndex = currentList.length;
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
                let newSelectionIndex = _selectedIndex;

                if(where === SELECT_DOWN &&
                  (_selectedIndex + 1 < resultList.childNodes.length)) {
                    newSelectionIndex++;
                } else if (where === SELECT_UP &&
                  (_selectedIndex > 0)) {
                    newSelectionIndex--;
                } else {
                    newSelectionIndex = -1;
                }

                observer.fire('selectionChanged', {
                    oldSelectedIndex: _selectedIndex,
                    selectedIndex: newSelectionIndex,
                    scrollNeeded: true
                });
            }
        };
    })();

    fastnav.resultList   = resultList;
    fastnav.list_manager = listManager;
    fastnav.SELECT_NONE  = SELECT_NONE;
    fastnav.SELECT_DOWN  = SELECT_DOWN;
    fastnav.SELECT_UP    = SELECT_UP;
})();
