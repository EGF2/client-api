"use strict";

const log = require("../components").logger;
const aclRules = require("./rules");
const co = require("co");
const clientData = require("../components").clientData;
const errors = require("../controllers/errors");

/**
  * Allow public access
  */
function allowPublicAccess(req) { // if one of rules has public access for GET requests only
    return getConfig(req).then(cfg =>
        cfg[req.method].split(",").some(rule => rule.startsWith("any"))
    );
}

/**
  * Prepare mromise for check access to object or edge
  */
function checkAccessPromise(req) {
    return co(function *() {
        try {
            // use 'LINK' for POST /src/edge_name/dst
            let method = (req.method === "POST" && req.params.dst) ? "LINK" : req.method;
            let config = (yield getConfig(req))[method].split(",");
            let rules = yield aclRules;
            let user = req.user;
            let id = req.params.id || req.params.src;
            let body = req.body || {};
            let conclusions = yield config.map(name => {
                try {
                    let r = rules[name];
                    if (r) {
                        let conclusion = r(user, id, body);
                        // use try because conclusion may be simple boolean type
                        try {
                            conclusion = conclusion.catch(() => false);
                        } catch (err) {}
                        return conclusion;
                    }
                } catch (err) {
                    log.error(err);
                }
                return false;
            });
            return conclusions.some(conclusion => conclusion === true);
        } catch (err) {
            return false;
        }
    });
}

/**
  * Check access to objects and edges
  */
function checkAccess(req, res, next) {
    checkAccessPromise(req)
    .then(ok => {
        if (ok) {
            next();
        } else {
            next(new errors.AccessForbidden());
        }
    })
    .catch(next);
}

/**
  * Check fields in body
  */
function checkUserFields(req, res, next) {
    co(function *() {
        if (req.dst === undefined && (req.method === "POST" || req.method === "PUT")) {
            // check body size
            if (!req.body || Object.keys(req.body).length === 0) {
                throw new errors.EmptyBody();
            }

            // check fields
            let objectType = req.body.object_type ?
                req.body.object_type :
                (yield clientData.getObjectType(req.params.id));
            let graph = yield clientData.getGraphConfig();
            let cfg = graph[objectType];
            if (!cfg) {
                throw new errors.IncorrectObjectType(objectType);
            }
            cfg = Object.assign({}, cfg.fields);
            cfg = Object.assign(cfg, graph.common_fields);

            for (let field in req.body) {
                if (field in cfg) {
                    let editMode = cfg[field].edit_mode;
                    if (editMode === "E" ||
                        (editMode === "NE" && req.method !== "PUT") ||
                        (editMode === "NC" && req.method !== "POST")) {
                        continue;
                    }
                }
                throw new errors.NotEditableField(field); // deny if field isn't in config
            }
        }
        return true;
    })
    .then(() => next())
    .catch(next);
}

/**
  * Set default values
  */
function defaultValues(req, res, next) {
    co(function *() {
        let graph = yield clientData.getGraphConfig();
        let cfg = graph[req.body.object_type];
        if (cfg.fields) {
            Object.keys(cfg.fields).forEach(field => {
                let fieldCfg = cfg.fields[field];
                if (fieldCfg.auto_value) {
                    switch (fieldCfg.auto_value) {
                    case "src.id":
                        req.body[field] = req.params.src;
                        break;
                    case "req.user":
                        req.body[field] = req.user;
                        break;
                    default:
                        throw new errors.IncorrectDefaultValue();
                    }
                }
            });
        }
    }).then(() => next())
    .catch(next);
}

/**
  * Get rules from config
  */
function getConfig(req) {
    return co(function *() {
        let objectId = req.params.id || req.params.src;
        let objectType = objectId ?
            yield clientData.getObjectType(objectId) :
            req.body.object_type;
        let graph = yield clientData.getGraphConfig();
        let cfg = graph[objectType];
        let edgeName = req.params.edge_name;
        if (edgeName) {
            cfg = cfg.edges[edgeName];
        }
        return cfg;
    });
}

module.exports = {
    allowPublicAccess,
    checkAccessPromise,
    checkAccess,
    checkUserFields,
    defaultValues
};
