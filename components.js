"use strict";

const option = require("commons/option");
const search = require("commons/search");
const bunyan = require("bunyan");

function init() {
    return option().config.then(config => {
        for (let key in config) {
            if (process.env[`egf_${key}`]) {
                try {
                    config[key] = JSON.parse(process.env[`egf_${key}`]);
                } catch (e) {
                    config[key] = process.env[`egf_${key}`];
                }
            }
        }

        const log = bunyan.createLogger({
            name: "client-api",
            level: config.log_level
        });

        log.info({config});

        module.exports.config = config;
        module.exports.clientData = require("commons/client-data")(config["client-data"]);
        module.exports.searcher = new search.Searcher(config.elastic);
        module.exports.logger = log;
        return module.exports;
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
}

module.exports = {
    init
};
