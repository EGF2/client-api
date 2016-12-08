"use strict";

const extra = require("./extra");
const clientData = require("../components").clientData;
const errors = require("./errors");
const expand = require("./expand");

function getObject(req, res, next) {
    let result = extra(req);
    if (!result) {
        result = clientData.getObject(req.params.id);
    }

    result.then(obj => {
        if (obj.deleted_at) {
            throw new errors.ObjectWasDeleted();
        }
        return expand(obj, req.user, req.params.expand);
    })
    .then(obj => res.send(obj))
    .catch(next);
}

function createObject(req, res, next) {
    let result = extra(req);
    if (!result) {
        result = clientData.createObject(req.body);
    }

    result.then(obj => res.send(obj))
    .catch(next);
}

function updateObject(req, res, next) {
    let result = extra(req);
    if (!result) {
        result = clientData.updateObject(req.params.id, req.body);
    }

    result.then(obj => res.send(obj))
    .catch(next);
}

function deleteObject(req, res, next) {
    let result = extra(req);
    if (!result) {
        result = clientData.deleteObject(req.params.id);
    }

    result.then(objectDeleted => res.send(objectDeleted))
    .catch(next);
}

module.exports = {
    getObject,
    createObject,
    updateObject,
    deleteObject
};
