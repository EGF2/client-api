"use strict";

const extra = require("./extra");
const clientData = require("../components").clientData;
const errors = require("./errors");
const expand = require("./expand");

function getObject(req, res, next) {
    extra(req).then(result => result ||
        clientData.getObject(req.params.id)
    ).then(obj => {
        if (obj.deleted_at) {
            throw new errors.ObjectWasDeleted();
        }
        return expand(obj, req.user, req.params.expand);
    })
    .then(obj => res.send(obj))
    .catch(next);
}

function createObject(req, res, next) {
    extra(req).then(result => result || clientData.createObject(req.body, req.user))
    .then(obj => res.send(obj))
    .catch(next);
}

function updateObject(req, res, next) {
    extra(req).then(result => result ||
        clientData.updateObject(req.params.id, req.body, req.user)
    )
    .then(obj => res.send(obj))
    .catch(next);
}

function deleteObject(req, res, next) {
    extra(req).then(result => result ||
        clientData.deleteObject(req.params.id, req.user)
    )
    .then(objectDeleted => res.send(objectDeleted))
    .catch(next);
}

module.exports = {
    getObject,
    createObject,
    updateObject,
    deleteObject
};
