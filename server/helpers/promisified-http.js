import {HTTP} from 'meteor/http';

const _HTTP = {};

_HTTP.get = function (url, options) {
    return new Promise((resolve, reject) => {
        HTTP.get(url, options, function(error, response){
            if(err) return reject(error);
            return resolve(response);
        });
    });
}

_HTTP.post = function (url, options) {
    return new Promise((resolve, reject) => {
        HTTP.post(url, options, function(error, response){
            if(err) return reject(error);
            return resolve(response);
        });
    });
}

_HTTP.put = function (url, options) {
    return new Promise((resolve, reject) => {
        HTTP.put(url, options, function(error, response){
            if(err) return reject(error);
            return resolve(response);
        });
    });
}

_HTTP.del = function (url, options) {
    return new Promise((resolve, reject) => {
        HTTP.del(url, options, function(error, response){
            if(err) return reject(error);
            return resolve(response);
        });
    });
}

_HTTP.call = function (method, url, options) {
    return new Promise((resolve, reject) => {
        HTTP.call(method, url, options, function(error, response){
            if(err) return reject(error);
            return resolve(response);
        });
    });
}

module.exports = {
    HTTP: _HTTP
}