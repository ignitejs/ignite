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