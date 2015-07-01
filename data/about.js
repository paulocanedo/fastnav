'use strict';

(() => {
    const versionLabel = document.getElementById('version');
    const titleLabel   = document.getElementById('title');

    self.port.on('metadata', mdata => {
        titleLabel.textContent   = mdata.name;
        versionLabel.textContent = mdata.version;
    });
})();
