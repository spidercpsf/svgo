'use strict';

exports.type = 'perItemAsync';

exports.active = true;

exports.params = {
    removeAny: false
};

exports.description = 'compress images';

var imagemin = require('imagemin');
var imageminMozjpeg = require('imagemin-mozjpeg');
var imageminPngquant = require('imagemin-pngquant');

var standardDescs = /^Created with/;

/**
 * Removes <desc>.
 * Removes only standard editors content or empty elements 'cause it can be used for accessibility.
 * Enable parameter 'removeAny' to remove any description.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Daniel Wabyick
 */
exports.fn = function(item, params) {
    return new Promise(
        function (resolve, reject) {
            doing(item, params, resolve, reject);
        });
};

function doing(item, params, resolve, reject){
    if(item.isElem('image')){
        console.log("Size:", item.attrs['xlink:href'].value.length);
        try{
            compress(["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/gif;base64,"], item.attrs['xlink:href'].value, function(new_based64){
                console.log("New Size:" + new_based64.length);
                item.attrs['xlink:href'].value = new_based64;
                resolve();
            });
        }catch(e){
            resolve();
        }
    }else{
        resolve();
    }
}

function compress(prefixs, based64, callback){
    prefixs.forEach(function(prefix){
        if(compressOne(prefix, based64, callback)) return;
    });
}

function compressOne(prefix, based64, callback){
    var prefix_length = prefix.length;
    if(based64.substring(0, prefix_length) === prefix){
        console.log("Start with " + prefix);
        var image_data = based64.substring(prefix_length, based64.length);
        // console.log(image_data);
        imagemin.buffer(new Buffer(image_data, 'base64'), {
            plugins: [
                imageminMozjpeg({quality: parseInt(process.env.SVGO_JPEG_QUALITY || '30')}),
                imageminPngquant({quality: process.env.SVGO_PNG_QUALITY || '65-80'}),
            ]
        }).then(function(buffer){
            var new_based64 = prefix + buffer.toString('base64');
            callback(new_based64);
        });
        return true;
    }
    return false;
}
