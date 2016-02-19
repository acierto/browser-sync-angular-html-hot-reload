angularTemplate.TEMPLATE_CHANGE_EVENT = 'template:change';

var instance,
    logger = function () {
    },
    _ = require('lodash'),
    minimatch = require('minimatch'),
    path = require('path'),
    fs = require('fs'),
    tamper = require('tamper'),
    fileChanger = require('./fileChanger'),
    options,
    at = angularTemplate;

/* istanbul ignore next */
function angularTemplate(opts, _instance_) {
    switch (arguments.length) {
        case 2:
            instance = _instance_;

            var eventName = 'file:changed';
            var oldListeners = instance.emitter.listeners(eventName);
            instance.emitter.removeAllListeners(eventName);
            instance.emitter.on(eventName, at.onFileChange);
            _.each(
                oldListeners, function (listener) {
                    instance.emitter.on(eventName, listener);
                }
            );
            break;
        case 1:
            return tamper(at.middleware);
    }
}

at.templateHash = {};

at.middleware = function (req, res) {

    if (at.isMatch(req.url, options.templates)) {
        logger('Time to mark injector.');
        return function (body) {
            at.templateHash[req.url] = fileChanger.id;
            return fileChanger.markInjector(body);
        }
    }
    else if (at.isMatch(req.url, options.indexJs)) {
        logger('Time to run injector.');
        return function (body) {
            return fileChanger.runInjector(body, options.moduleName);
        };
    }
};


at.onFileChange = function (data) {

    if (at.isMatch(data.path, options.templates)) {
        data.event = 'do not ' + data.event;
        var response = at.createResponse(data);
        if (instance && response) {
            instance.io.sockets.emit(at.TEMPLATE_CHANGE_EVENT, response);
        }
    }
};

at.createResponse = function (data) {
    var templateUrl = findTemplate(data.path),
        templateId = at.templateHash[templateUrl];

    if (templateId !== void 0) {

        return {
            selector: '[igat="%ID%"]'.replace('%ID%', templateId),
            template: fileChanger.markInjector(fs.readFileSync(process.cwd() + data.path, 'utf8'), templateId),
            templateUrl: templateUrl
        }
    }

    return false;
};

function findTemplate(filePath) {
    var filePathArray = filePath.replace('\\', '/').split('/'),
        key;

    while (filePathArray.length > 0) {
        filePathArray.shift();
        key = '/' + filePathArray.join('/');
        if (at.templateHash[key] !== void 0) {
            return key;
        }
    }

    return false;
}

at.isMatch = function (filePath, patther) {
    return minimatch(filePath, patther);
};

/* istanbul ignore next */
at.setLogger = function (newLogger) {
    logger = newLogger || function () {
        };
};

at.setInstance = function (newInstance) {
    instance = newInstance || {};
};

at.setOption = function (newOptions) {
    var moduleName;

    /* istanbul ignore if */
    if (fs.existsSync(process.cwd() + '/bower.json')) {
        moduleName = require(process.cwd() + '/bower.json').name;
    }
    else if (fs.existsSync(process.cwd() + '/package.json')) {
        moduleName = require(process.cwd() + '/package.json').name;
    }

    options = _.defaults(
        newOptions || {},
        {
            indexJs: 'index.js',
            templates: '**/*.html',
            moduleName: moduleName
        }
    );

    var startWith = '**/';

    if (options.templates.indexOf(startWith) !== 0) {
        options.templates = startWith + options.templates;
    }

    if (options.indexJs.indexOf(startWith) !== 0) {
        options.indexJs = startWith + options.indexJs;
    }

    return options;
};

module.exports = at;