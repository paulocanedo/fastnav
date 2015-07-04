'use strict';

(() => {
    var observer = (() => {
        let handlers = new Map();

        return {
            subscribe(what, handler) {
                let collection = handlers.get(what);
                if(!collection) {
                    collection = new Set();
                    handlers.set(what, collection);
                }

                collection.add(handler);
            },
            unsubscribe(what, handler) {
                let collection = handlers.get(what);
                if(collection) {
                    collection.delete(handler);
                }
            },
            fire(what, params) {
                let collection = handlers.get(what);
                if(collection) {
                    collection.forEach(handler => handler(params));
                }
            }
        };
    })();

    fastnav.observer = observer;
    // test
    // let handler1 = (what, param) => {
    //     console.log('fired from evt1', what, param);
    // };
    // let handler2 = (what, param) => {
    //     console.log('fired from evt2', what, param);
    // };
    //
    // observer.subscribe('evt#1', handler1);
    // observer.subscribe('evt#2', handler2);
    //
    // observer.fire('evt#1', 'Hello World');
    // observer.fire('evt#2', 'testing observer');
    //
    // observer.unsubscribe('evt#1', handler1);
    //
    // observer.fire('evt#1', '2nd Hello World');
    // observer.fire('evt#2', '2nd testing observer');
})();
