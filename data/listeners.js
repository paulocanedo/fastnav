'use strict';

(() => {
    const searchField = fastnav.searchField;
    const listManager = fastnav.list_manager;

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
            listManager.moveSelection(fastnav.SELECT_UP);
        } else if(evt.keyCode === KeyEvent.DOM_VK_DOWN) {
            listManager.moveSelection(fastnav.SELECT_DOWN);
        }
    });

})();
