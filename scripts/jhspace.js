/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
class JHObject {
    constructor(parent, name) {
        this._name = name;
        this._textures = {};
        this._objects = [];
        const obj = $('<div></div>');
        this._objects.push(obj);
        obj.attr('name', name);
        obj.attr('data-jh-type', 'jhobject');
        obj.attr('data-jh-tree', '0');
        obj.hide();
        parent.append(obj);
    };
    addClass(clsname) {
        this._objects[0].addClass(clsname);
    };
    show() {
        return this._objects[0].show();
    };
    hide() {
        return this._objects[0].hide();
    };
    fadeIn(timems) {
        if (!timems) {
            timems = 400;
        }
        return this._objects[0].fadeIn(timems).promise();
    };
    fadeOut() {
        return this._objects[0].fadeOut().promise();
    };
    setBackground(img) {
        if (img) {
            this._objects[0].css('background-image', 'url(\'' + core.versionUrl(img) + '\')');
        } else {
            this._objects[0].css('background-image', '');
        }
    };
    setAttr(key, value) {
        this._objects[0].attr(key, value);
    };
    getAttr(key, value) {
        return this._objects[0].attr(key);
    };
    get object() {
        return this._objects[0];
    }
}
