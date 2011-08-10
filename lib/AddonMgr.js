//[
// Copyright (c) 2011, Richard Miller-Smith & David Hammond.
// All rights reserved. Redistribution and use in source and binary forms, 
// with or without modification, are permitted provided that the following 
// conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of the ignite.js project, nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//]

var _ = require('underscore'),
    util = require('util'),
    SubMods = require('./utils/submods').SubMods;

var defaultAddons = {}, otherAddons;


function AddonApi (destObj) {
  this.destObj = destObj ;
  
  if (!destObj.addons) {
    destObj.addons = {} ;
  }
}

AddonApi.prototype.registerAddon = function (name, addonObj) {
  this.destObj.addons[name] = addonObj ;
} ;

AddonApi.prototype.registerAddonFn = function (addonName, fnName, fn) {
  return this.destObj._setPublicObj(fnName, 
      fn.bind(this.destObj._getPrivateObj(addonName))) ;
} ;

AddonApi.prototype.registerAddonObj = function (addonName, objName, obj) {
  return this.destObj._setPublicObj(objName, obj) ;
} ;


// Pre-load default add-on modules
(function Init () {
  var addons ;
  
  addons = new SubMods(module, "addons/defaults") ;
  
  addons.each(function (addon, name) {
    defaultAddons[name] = addon.load() ;
  }) ;
  
  otherAddons = new SubMods(module, "addons/others") ;
})() ;


function AddonMgr (factory, addonOpts) {
  addonOpts = addonOpts || {} ;
  
  this.addons = {} ;
  this.addonApi = new AddonApi(this) ;

  // Create object in which to hold private objects
  this._addons = {} ;
  // Create object on factory in which to hold public functions/objects
  factory.addons = {} ;

  this.jsmFactory = factory ;

  if (_.isArray(addonOpts)) {
    addonOpts = { load: addonOpts } ;
  }
  
  // load contains a list of (non-default) plugin names to load
  if (addonOpts.load) {
    _.each(addonOpts.load, function (addonName) {
      if (otherAddons.exists(addonName)) {
        this._runAddon(addonName, otherAddons.load(addonName)) ;
      } else if (addonName in defaultAddons) {
        // Do nothing - the plugin will be loaded anyway
      } else {
        throw new Error("Unknown plugin: "+addonName) ;
      }
    }, this) ;
  }
  
  // loadAs is an object, where the plugins contained within
  // the values, are loaded as the names given in the strings.
  if (addonOpts.loadAs) {
    _.each(addonOpts.loadAs, function (origName, newName) {
      if (otherAddons.exists(origName)) {
        this._runAddon(newName, otherAddons.load(origName)) ;
      } else if (origName in defaultAddons) {
        // We're loading a default plugin under a different name
        defaultAddons[newName] = defaultAddons[origName] ;
      } else {
        throw new Error("Unknown plugin: "+origName) ;
      }
    }, this) ;
  }
  
  addonOpts.exclude = addonOpts.exclude || [] ;
  
  _.each(defaultAddons, function (mod, modname) {
    if (addonOpts.exclude.indexOf(modname) < 0) {
      this._runAddon(modname, mod) ;
    }
  }, this) ;
  
}

AddonMgr.prototype._getPublicObj = function (name) {
  return this.jsmFactory.addons[name] ;
} ;

AddonMgr.prototype._setPublicObj = function (name, val) {
  var old = this.jsmFactory.addons[name] ;
  this.jsmFactory.addons[name] = val ;
  return old ;
} ;

AddonMgr.prototype._getPrivateObj = function (name) {
  if (! this._addons[name]) {
    this._addons[name] = {} ;
  }
  return this._addons[name] ;
} ;

AddonMgr.prototype._runAddon = function (name, mod) {
  if (typeof mod === "function") {
    mod(this.addonApi, name) ;
  }
} ;

AddonMgr.prototype._applyFn = function (fnName) {
  var args = _.toArray(arguments) ;
  _.each(this.addons, function (addon, addonName) {
    if (addon[fnName] && typeof addon[fnName] === "function") {
      args[0] = this._getPrivateObj(addonName) ;
      addon[fnName].apply(addon, args) ;
    }
  }, this) ;
} ;
  
AddonMgr.prototype.initAddons = function () {
  this._applyFn("init", this.jsmFactory) ;
} ;

AddonMgr.prototype.attachAddons = function (jsm) {
  this._applyFn("attach", this.jsmFactory, jsm) ;
} ;

AddonMgr.prototype.detachAddons = function (jsm) {
  this._applyFn("detach", this.jsmFactory, jsm) ;
} ;

module.exports = AddonMgr ;