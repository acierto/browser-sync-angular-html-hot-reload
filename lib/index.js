var angularTemplate = require('./angularTemplate');
const PLUGIN_NAME = "BrowserSync Angular Html Hot Reload";
const CLIENT_JS = "/../client/client.js";


var plugin = {
  "plugin:name": PLUGIN_NAME,
  "plugin": angularTemplate,
  "hooks": {
    "client:js": "",
    "server:middleware": angularTemplate
  }
};

module.exports = function (opts) {
  //var config   = merger.set({simple: true}).merge(defaults, opts);
  angularTemplate.setOption(opts);
  var clientJs = require("fs").readFileSync(__dirname + CLIENT_JS, "utf-8");
  plugin.hooks["client:js"] = clientJs.replace("%EVENT%", angularTemplate.TEMPLATE_CHANGE_EVENT);
  return plugin;
};
