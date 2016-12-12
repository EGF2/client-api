"use strict";

const clientData = require("../../components").clientData;

// "METHOD src/edge_name" or "METHOD objectId" : handler
// each handler must return Promise
var handlerRegistry = {
};

function handler(req) {
    let promise = req.params.id || req.params.src ?
        clientData.getObjectType(req.params.id || req.params.src) :
        Promise.resolve(req.body.object_type);
    return promise.then(objectType => {
        let key = req.method + " " + objectType + (req.params.edge_name ? "/" + req.params.edge_name : "");
        let handler = handlerRegistry[key];
        if (handler) {
            return handler(req);
        }
    });
}
module.exports = handler;
