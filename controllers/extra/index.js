"use strict";

const clientData = require("../../components").clientData;

// "METHOD src/edge_name" or "METHOD objectId" : handler
// each handler must return Promise
var handlerRegistry = {
};

function handler(req) {
    let key = req.method + " ";
    key += clientData.getObjectType(req.params.id || req.params.src || req.body.object_type);
    key += req.params.edge_name ? "/" + req.params.edge_name : "";

    let handler = handlerRegistry[key];
    if (handler) {
        return handler(req);
    }
}
module.exports = handler;
