/* jshint browser: true */
'use strict';

(() => {
    const versionLabel = document.getElementById('version');
    const titleLabel   = document.getElementById('title');

    self.port.on('metadata', mdata => {
        titleLabel.textContent   = mdata.title;
        versionLabel.textContent = mdata.version;
    });
})();
