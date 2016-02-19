var fs = require('fs');

module.exports = {
    id: 0,

    runInjector: function (file, moduleName) {
        var fileContent = file;

        if (typeof file !== 'string') {
            throw new Error('Run injector: file content must be sting or file.');
        }


        if (!moduleName) {
            throw new Error('Run injector: module name should be set.');
        }

        var newContent =
            fs.readFileSync(__dirname + '/../client/runInjector.js', 'utf8')
                .replace('%MODULE_NAME%', moduleName);

        return fileContent + newContent;
    },

    markInjector: function (template, id) {
        id = id === void 0 ? this.id++ : id;

        if (typeof template != 'string') {
            throw new Error('Run injector: template should be a string.');
        }
        var openTag = /(<[\S]+)/;

        return template.replace(openTag, '$1 igat="' + (id) + '"');
    }
};
