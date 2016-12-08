"use strict";

const restify = require("restify");
const util = require("util");

function IncorrectObjectType(objectType) {
    restify.RestError.call(this, {
        restCode: "IncorrectObjectType",
        statusCode: 400,
        message: `Incorrect object type '${objectType}'`,
        constructorOpt: IncorrectObjectType
    });
    this.name = "IncorrectObjectType";
}
util.inherits(IncorrectObjectType, restify.RestError);

function UnknownObjectType() {
    restify.RestError.call(this, {
        restCode: "UnknownObjectType",
        statusCode: 400,
        message: "Unknown object type",
        constructorOpt: UnknownObjectType
    });
    this.name = "UnknownObjectType";
}
util.inherits(UnknownObjectType, restify.RestError);

function IncorrectDefaultValue() {
    restify.RestError.call(this, {
        restCode: "IncorrectDefaultValue",
        statusCode: 500,
        message: "Incorrect default value",
        constructorOpt: IncorrectDefaultValue
    });
    this.name = "IncorrectDefaultValue";
}
util.inherits(IncorrectDefaultValue, restify.RestError);

function UnavailableExpandLevel() {
    restify.RestError.call(this, {
        restCode: "UnavailableExpandLevel",
        statusCode: 400,
        message: "Unavailable expand level",
        constructorOpt: UnavailableExpandLevel
    });
    this.name = "UnavailableExpandLevel";
}
util.inherits(UnavailableExpandLevel, restify.RestError);

function IncorrectExpandFormat() {
    restify.RestError.call(this, {
        restCode: "IncorrectExpandFormat",
        statusCode: 400,
        message: "Incorrect expand format",
        constructorOpt: IncorrectExpandFormat
    });
    this.name = "IncorrectExpandFormat";
}
util.inherits(IncorrectExpandFormat, restify.RestError);

function AccessForbidden() {
    restify.RestError.call(this, {
        restCode: "AccessForbidden",
        statusCode: 403,
        message: "Access forbidden",
        constructorOpt: AccessForbidden
    });
    this.name = "AccessForbidden";
}
util.inherits(AccessForbidden, restify.RestError);

function EmptyBody() {
    restify.RestError.call(this, {
        restCode: "EmptyBody",
        statusCode: 400,
        message: "Empty body",
        constructorOpt: EmptyBody
    });
    this.name = "EmptyBody";
}
util.inherits(EmptyBody, restify.RestError);

function NotEditableField(field) {
    restify.RestError.call(this, {
        restCode: "NotEditableField",
        statusCode: 403,
        message: `'${field}' field is not editable or contains incorrect value`,
        constructorOpt: NotEditableField
    });
    this.name = "NotEditableField";
}
util.inherits(NotEditableField, restify.RestError);

function ObjectWasDeleted() {
    restify.RestError.call(this, {
        restCode: "ObjectWasDeleted",
        statusCode: 404,
        message: "Object was deleted",
        constructorOpt: ObjectWasDeleted
    });
    this.name = "ObjectWasDeleted";
}
util.inherits(ObjectWasDeleted, restify.RestError);

function IncorrectCountParameter(max) {
    restify.RestError.call(this, {
        restCode: "IncorrectCountParameter",
        statusCode: 400,
        message: `Incorrect count parameter. Count parameter must be between 0 and ${max}`,
        constructorOpt: IncorrectCountParameter
    });
    this.name = "IncorrectCountParameter";
}
util.inherits(IncorrectCountParameter, restify.RestError);

module.exports = {
    IncorrectObjectType,
    UnknownObjectType,
    IncorrectDefaultValue,
    UnavailableExpandLevel,
    IncorrectExpandFormat,
    AccessForbidden,
    EmptyBody,
    NotEditableField,
    ObjectWasDeleted,
    IncorrectCountParameter
};
