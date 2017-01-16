"use strict";

/* eslint max-nested-callbacks: ["error", 5] */

const clientData = require("../components").clientData;
const searcher = require("../components").searcher;
const errors = require("./errors");
const expand = require("./expand");
const acl = require("../acl");

function parseFilters(filters) {
    let res = {};
    let key;
    let spl = filters ? filters.split(":") : [];
    spl.forEach((elem, i) => {
        let arr = elem.split(",");
        if (i === 0) {
            key = elem;
        } else if (i + 1 === spl.length) {
            res[key] = arr;
        } else {
            res[key] = arr.slice(0, arr.length - 1);
            key = arr[arr.length - 1];
        }
    });
    Object.keys(res).forEach(key => {
        res[key] = res[key].length > 1 ? res[key] : res[key][0];
    });
    return res;
}

function parseFields(fields) {
    return (fields) ? fields.split(",") : [];
}

function parseRange(fields) {
    let set = (fields) ? fields.split(",") : [];
    let range = {};
    set.forEach(item => {
        let parse = item.split(":");
        range[parse[0]] = {};
        range[parse[0]].gte = parse[1];
        range[parse[0]].lte = parse[2];
    });
    return range;
}

function options(req) {
    let object = req.query.object;
    if (!object) {
        throw new errors.UnknownObjectType();
    }

    let fields = parseFields(req.query.fields);
    let q = req.query.q;

    let filters = parseFilters(req.query.filters);

    let range = parseRange(req.query.range);

    let sort = req.query.sort ? req.query.sort.split(",") : undefined;

    // set after parameter
    let after = req.query.after;

    // set page size
    let countPromise = clientData.getGraphConfig().then(graph => {
        if (req.query.count === undefined) {
            return graph.pagination.default_count || 25;
        }
        let count = parseInt(req.query.count, 10);
        if (isNaN(count) || count < 0 || count > graph.pagination.max_count) {
            throw new errors.IncorrectCountParameter(graph.pagination.max_count);
        }
        return count;
    });

    return countPromise.then(count => {
        return {object, fields, q, filters, sort, range, count, after};
    });
}

function Search(req, res, next) {
    try {
        options(req).then(opt => searcher.search(opt)
            .then(page => {
                if (page.results.length === 0) {
                    return page;
                }

                // check ACLs
                return Promise.all(page.results.map(id => {
                    return acl.checkAccessPromise({
                        method: "GET",
                        user: req.user,
                        params: {id}
                    }).then(ok => {
                        if (!ok) {
                            throw new errors.AccessForbidden();
                        }
                    });
                }))
                .then(() => clientData.getObjects.apply(null, page.results).then(objects => {
                    page.results = page.results.length === 1 ? [objects] : objects.results;
                    return Promise.all(page.results.map(obj => expand(obj, req.user, req.params.expand)))
                        .then(() => page);
                }));
            })
        )
        .then(page => res.send(page))
        .catch(next);
    } catch (err) {
        next(err);
    }
}

module.exports.Search = Search;
