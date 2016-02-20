angularTemplate.TEMPLATE_CHANGE_EVENT = 'template:change';

var instance,
    logger = function () {
    },
    _ = require('lodash'),
    glob = require("glob"),
    minimatch = require('minimatch'),
    path = require('path'),
    fs = require('fs'),
    tamper = require('tamper'),
    fileChanger = require('./fileChanger'),
    options,
    at = angularTemplate;

var init = (function () {
    var executed = false;
    return function () {
        if (!executed) {
            executed = true;
            var globPattern = process.cwd() + '/' + options.templates;
            glob(globPattern, {}, function (er, fileNames) {
                console.log('found files', fileNames);
                _.forEach(fileNames, function (fileName) {
                    at.templateHash[fileName] = fileChanger.id;
                });
            });
        }
    };
})();

function angularTemplate(opts, _instance_) {
    init();
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

at.middleware = function (req) {

    if (at.isMatch(req.url, options.indexJs)) {
        logger('Time to run injector.');
        return function (body) {
            return fileChanger.runInjector(body, options.moduleName);
        };
    }
};


at.onFileChange = function (data) {
    var isMatched = at.isMatch(data.path, process.cwd() + '/' + options.templates);

    if (isMatched) {
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

        if (options.transformToTemplate) {
            templateUrl = options.transformToTemplate(templateUrl);
        }

        return {
            selector: '[igat="%ID%"]'.replace('%ID%', templateId),
            template: fileChanger.markInjector(fs.readFileSync(data.path, 'utf8'), templateId),
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

at.setLogger = function (newLogger) {
    logger = newLogger || function () {
        };
};

at.setInstance = function (newInstance) {
    instance = newInstance || {};
};

at.setOption = function (newOptions) {

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

    return options;
};

module.exports = at;