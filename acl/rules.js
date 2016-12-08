"use strict";

/* eslint camelcase: 0 */

const clientData = require("../components").clientData;
const log = require("../components").logger;

/**
  * Rule is a function which takes three parameters (user, id, body)
  * Rule must return bool or Promise<bool>
  */
let rules = clientData.getGraphConfig().then(config => {
    // add role-based rules
    let rules = {};
    try {
        config.user.edges.roles.contains.forEach(role => {
            rules[role] = user => checkRole(user, role);
        });
    } catch (err) {
        log.warn("Role-based ACL rules does not configured", err);
    }
    return rules;
}).then(rules =>
    // add other rules
    Object.assign(rules, {
        any: () => true,
        registered_user: user => Boolean(user),
        self: (user, id, body) => self(user, id, body)
    })
);
module.exports = rules;

// use in order to exclude undefined values
function isEqual(user, target) {
    if (user && target) {
        return user === target;
    }
    return false;
}

function self(user, id, body, verified) {
    let self = (isEqual(user, id) || isEqual(user, body.user)) ?
        Promise.resolve(true) : clientData.getObject(id).then(obj => isEqual(user, obj.user));
    return self.then(self => (self && verified) ? clientData.getObject(user).then(user => user.verified) : self);
}

function checkRole(user, role) {
    return user ? clientData.getEdges(user, "roles").then(roles =>
            roles.results.some(r => r.object_type === role)
        ) : Promise.resolve(false);
}

// function checkUserInEdge(user, id, edgeName) {
//     return clientData.getEdges(id, edgeName, {expand: true})
//         .then(objects => objects.some(obj => isEqual(user, obj.user)));
// }
