"use strict";

const log = require("./components").logger;
const restify = require("restify");
const acl = require("./acl");
const xss = require("xss");
const auth = require("commons/auth");
const config = require("./components").config;
const objects = require("./controllers/objects");
const edges = require("./controllers/edges");
const search = require("./controllers/search");

/**
  * Replace me in request parameters
  */
function meSubstitution(req, res, next) {
    try {
        let user = req.user;
        if (user) {
            ["id", "src", "dst"].forEach(p => {
                if (p in req.params && req.params[p] === "me") {
                    req.params[p] = user;
                }
            });
        }
    } catch (err) {
        log.error(err);
    }
    next();
}

function sanitize(req, res, next) {
    try {
        let options = {
            whiteList: {
                b: {}, i: {}, u: {}, s: {}, a: {},
                br: {}, ul: {}, ol: {}, li: {},
                div: {}, span: {}
            },
            stripIgnoreTag: true,
            stripIgnoreTagBody: ["script"]
        };
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === "string") {
                req.body[key] = xss(req.body[key], options);
            }
        });
    } catch (err) {
        log.error(err);
    }
    next();
}

/**
  * Create server
  */
function createServer() {
    let server = restify.createServer({
        name: "client-api"
    });

    server.use(restify.queryParser());
    server.use(restify.bodyParser({
        mapParams: false
    }));
    server.use(auth.handler(config.auth, acl.allowPublicAccess));

    // Search API
    server.get("/v1/search", search.Search);

    // Apply handlers to /v1/graph endpoints
    server.use(meSubstitution);
    server.use(acl.checkAccess);

    let checkUserFields = acl.checkUserFields;
    let defaultValues = acl.defaultValues;

    // Objects API
    server.post("/v1/graph", sanitize, checkUserFields, defaultValues, objects.createObject);
    server.get("/v1/graph/:id", objects.getObject);
    server.put("/v1/graph/:id", sanitize, checkUserFields, objects.updateObject);
    server.del("/v1/graph/:id", objects.deleteObject);

    // Edges API
    server.post("/v1/graph/:src/:edge_name/:dst", edges.createEdge);
    server.post("/v1/graph/:src/:edge_name", sanitize, checkUserFields, defaultValues, edges.createEdgeAndObject);
    server.del("/v1/graph/:src/:edge_name/:dst", edges.deleteEdge);
    server.get("/v1/graph/:src/:edge_name", edges.getEdgeObjects);
    server.get("/v1/graph/:src/:edge_name/:dst", edges.getEdgeObject);

    return server;
}
module.exports.createServer = createServer;
