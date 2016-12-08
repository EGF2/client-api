"use strict";

/* eslint camelcase: 0 */
/* eslint max-nested-callbacks: ["error", 5] */

const acl = require("../acl");
const clientData = require("../components").clientData;
const errors = require("../controllers/errors");

const EXPAND_LEVEL = 3;

function parseExpand(doc, expand) {
    // prepare expand array
    let expandArr = []; // contains expand fields
    let current = ""; // current expand item
    let circle = 0; // count of circle brackets
    let curly = 0; // count of curly brackets

    expand.split("").forEach(ch => {
        switch (ch) {
        case ",":
            if (circle === 0 && curly === 0) {
                expandArr.push(current);
                current = "";
                circle = curly = 0;
            } else {
                current += ch;
            }
            break;
        case "(":
            current += ch;
            circle++;
            break;
        case ")":
            current += ch;
            circle--;
            break;
        case "{":
            current += ch;
            curly++;
            if (curly >= EXPAND_LEVEL) {
                throw new errors.UnavailableExpandLevel();
            }
            break;
        case "}":
            current += ch;
            curly--;
            break;
        default:
            current += ch;
        }
    });

    if (circle !== 0 || curly !== 0) {
        throw new errors.IncorrectExpandFormat();
    }
    if (current) {
        expandArr.push(current);
    }

    // prepare promises with keys
    return Promise.all(expandArr.map(key => {
        let v = key.split("(", 2)[0]; // clean key
        v = v.split("{", 2)[0];
        if (v in doc) {
            return Promise.resolve(key);
        }
        return clientData.getEdgeConfig(doc.id, key)
            .then(() => key)
            .catch(() => undefined);
    })).then(keys => keys.filter(v => v));
}

function prepareRequests(doc, user, expand) {
    return parseExpand(doc, expand).then(keys => {
        // prepare virtual request to take object or edge
        let requests = [];
        keys.forEach(key => {
            let nextExpand = "";
            let index = key.indexOf("{");
            if (index > -1) {
                nextExpand = key.slice(index + 1, -1);
                key = key.slice(0, index);
            }

            let splitted = key.split("(", 2);
            key = splitted[0];

            let fields = key.split(".");
            if (fields.length > 1) {
                if (Array.isArray(doc[fields[0]])) {
                    doc[fields[0]].forEach((obj, i) => {
                        let req = {
                            key: `${fields[0]}.${i}.${fields[1]}`, // inject key to know expand field
                            user,   // use for ACL
                            method: "GET",
                            params: {id: obj[fields[1]], expand: nextExpand},
                            query: {}
                        };
                        requests.push(req);
                    });
                } else if (doc[fields[0]] && doc[fields[0]][fields[1]]) {
                    let req = {
                        key: `${fields[0]}.${fields[1]}`, // inject key to know expand field
                        user,   // use for ACL
                        method: "GET",
                        params: {id: doc[fields[0]][fields[1]], expand: nextExpand},
                        query: {}
                    };
                    requests.push(req);
                }
            } else {
                let req = {
                    key, // inject key to know expand field
                    user, // use for ACL
                    method: "GET",
                    params: (key in doc) ?
                        {id: doc[key], expand: nextExpand} :
                        {src: doc.id, edge_name: key, expand: nextExpand},
                    query: {}
                };

                if (splitted.length > 1) {
                    let count = splitted[1].slice(0, -1);
                    req.query.count = count;
                }

                requests.push(req);
            }
        });
        return requests;
    });
}

/**
  * Expand object fields or edges
  */
function expandResult(doc, user, expand) {
    if (!expand) {
        return doc;
    }
    return prepareRequests(doc, user, expand).then(requests => {
        let results = requests.map(req =>
            acl.checkAccessPromise(req) // check ACL
            .then(ok => {
                if (ok) {
                    let promise = req.params.edge_name ?
                        clientData.getEdges(req.params.src, req.params.edge_name, req.params.dst)
                            .then(page =>
                                Promise.all(page.results.map(obj => expandResult(obj, req.user, req.params.expand)))
                                .then(() => page)
                            ) :
                        clientData.getObject(req.params.id)
                            .then(obj => expandResult(obj, req.user, req.params.expand));

                    return Promise.all([req, promise])
                        .then(result => ({
                            key: result[0].key,
                            value: result[1]
                        }));
                }
                throw new errors.AccessForbidden();
            })
        );

        return Promise.all(results).then(expands => {
            expands.filter(v => v).forEach(expand => {
                let obj = doc;
                let fields = expand.key.split(".");
                fields.forEach((field, i) => {
                    if (i === fields.length - 1) {
                        obj[field] = expand.value;
                    } else {
                        obj = obj[field];
                    }
                });
            });
            return doc;
        });
    });
}
module.exports = expandResult;
