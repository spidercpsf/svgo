'use strict';

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {Object} data input data
 * @param {Object} plugins plugins object from config
 * @return {Object} output data
 */
module.exports = function(data, plugins, callback) {

    plugins.forEach(function(group) {

        switch(group[0].type) {
            case 'perItem':
                data = perItem(data, group);
                break;
            case 'perItemReverse':
                data = perItem(data, group, true);
                break;
            case 'full':
                data = full(data, group);
                break;
        }

    });

    var used_async = false;
    plugins.forEach(function(group) {
        switch(group[0].type) {
            case 'perItemAsync':
                console.log("Using async...");
                used_async = true;
                try{
                    perItemAsync(data, group).then((result) => {
                        callback(data);
                    });
                }catch(e){
                    console.error(e);
                    callback(data);
                }
                break;
        }
    });
    if(!used_async) callback(data);
};

/**
 * Direct or reverse per-item loop.
 *
 * @param {Object} data input data
 * @param {Array} plugins plugins list to process
 * @param {Boolean} [reverse] reverse pass?
 * @return {Object} output data
 */
function perItem(data, plugins, reverse) {

    function monkeys(items) {

        items.content = items.content.filter(function(item) {

            // reverse pass
            if (reverse && item.content) {
                monkeys(item);
            }

            // main filter
            var filter = true;

            for (var i = 0; filter && i < plugins.length; i++) {
                var plugin = plugins[i];

                if (plugin.active && plugin.fn(item, plugin.params) === false) {
                    filter = false;
                }
            }

            // direct pass
            if (!reverse && item.content) {
                monkeys(item);
            }

            return filter;

        });

        return items;

    }

    return monkeys(data);

}

/**
 * "Full" plugins.
 *
 * @param {Object} data input data
 * @param {Array} plugins plugins list to process
 * @return {Object} output data
 */
function full(data, plugins) {

    plugins.forEach(function(plugin) {
        if (plugin.active) {
            data = plugin.fn(data, plugin.params);
        }
    });

    return data;

}

/**
 * "perItemAsync" plugins.
 *
 * @param {Object} data input data
 * @param {Array} plugins plugins list to process
 * @return {Object} output data
 */
function perItemAsync(data, plugins) {
    return new Promise(function(resolve, reject){
        var waits = [];
        function monkeys(items) {
            items.content.forEach(function(item) {
                plugins.forEach((plugin) => {
                    waits.push(plugin.fn(item, plugin.params));
                })

                if (item.content) {
                    monkeys(item);
                }
            });
        }

        monkeys(data);
        Promise.all(waits).then((results) => {
            resolve();
        }).catch(err => {
            resolve();
        })
    });
}
