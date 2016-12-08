"use strict";

const extra = require("./extra");
const clientData = require("../components").clientData;
const expand = require("./expand");

function createEdge(req, res, next) {
    let result = extra(req);
    if (!result) {
        result = clientData.createEdge(req.params.src, req.params.edge_name, req.params.dst);
    }

    result.then(edgeCreated => res.send(edgeCreated))
    .catch(next);
}

function createEdgeAndObject(req, res, next) {
    let result = extra(req);
    if (!result) {
        result = clientData.createObject(req.body)
            .then(obj =>
                clientData.createEdge(req.params.src, req.params.edge_name, obj.id)
                    .then(() => obj)
            );
    }

    result.then(obj => res.send(obj))
    .catch(next);
}

function deleteEdge(req, res, next) {
    let result = extra(req);
    if (!result) {
        result = clientData.deleteEdge(req.params.src, req.params.edge_name, req.params.dst);
    }

    result.then(edgeDeleted => res.send(edgeDeleted))
    .catch(next);
}

function getEdgeObjects(req, res, next) {
    let result = extra(req);
    if (!result) {
        let options = {
            after: req.params.after,
            count: req.params.count
        };
        result = clientData.getEdges(req.params.src, req.params.edge_name, options);
    }

    result.then(page => Promise.all(page.results.map(obj => expand(obj, req.user, req.params.expand))).then(() => page))
    .then(page => res.send(page))
    .catch(next);
}

function getEdgeObject(req, res, next) {
    clientData.getEdge(req.params.src, req.params.edge_name, req.params.dst)
    .then(obj => expand(obj, req.user, req.params.expand))
    .then(obj => res.send(obj))
    .catch(next);
}

module.exports = {
    getEdgeObjects,
    getEdgeObject,
    createEdge,
    createEdgeAndObject,
    deleteEdge
};
