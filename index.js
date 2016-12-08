"use strict";

const components = require("./components");

components.init().then(comp => {
    const server = require("./server").createServer();
    server.listen(comp.config.port, function() {
        comp.logger.info("client-api started...");
    });
});
