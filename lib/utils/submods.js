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

/*jshint newcap: false */
var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    _ = require('underscore') ;

function _SubMod(name, filename, fullpath, priority) {
  this.name = name ;
  this.filename = filename ;
  this.fullpath = fullpath ;
  this.priority = priority ;
}

_SubMod.prototype.load = function () {
  return require(this.fullpath) ;
} ;

_SubMod.prototype.alias = function (newname) {
  return new _SubMod(newname, this.filename, this.fullpath, this.priority) ;
} ;


function _scanDir (dir, submods, regExp, recurse, defaultPriority) {
  var newDirs = [],
      priorityRegExp = /([0-9]+)_(.+)/, pe, priority,
      contents, pos, fpath, fullpath, name, stat ;

//  util.debug("Doing dir: "+dir) ;
  
  try {
    contents = fs.readdirSync(dir) ;
  } catch (e) {
    contents = [] ;
  }
  
  for (pos=0;pos<contents.length;pos++) {
    fpath = contents[pos] ;
    fullpath = path.join(dir, fpath) ;
    
    stat = fs.statSync(fullpath) ;
    if (stat.isFile()) {
      // Check match, if present
      if (!regExp.test(fpath)) {
        return ;
      }
      name = regExp.exec(fpath)[1] ;
      if (priorityRegExp.test(name)) {
        pe = priorityRegExp.exec(name) ;
        priority = pe[1] ;
        priority = parseInt(priority, 10) ;
        name = pe[2] ;
      } else {
        priority = defaultPriority ;
      }
      
//      util.debug("New: "+name+" "+priority) ;
      submods[name] = new _SubMod(name, fpath, fullpath, priority) ;
    } else if (stat.isDirectory() && recurse) {
      if (path.basename(fpath)[0] !== ".") {
//        util.debug("Adding "+fpath) ;
        newDirs.push(path.join(dir, fpath)) ;
      }
    }
  }
  
  return newDirs ;
}


function SubMods(moddir, submoddir, regExp, recurse, defaultPriority) {
  var dirlist, dir, submods, defaultRegExp, def, pos, newDirs ;
  if (typeof moddir === "object") {
    if (_.isArray(moddir)) {
      moddir = path.join(
          path.dirname(moddir[0].filename),
          moddir[1]);
    } else {
      moddir = path.dirname(moddir.filename) ;
    }
  }
  if (!regExp) {
    regExp = /(.+)\.js$/ ;
  }
  
  if (defaultPriority == null) {
    defaultPriority = 50 ;
  }
  
  dir = path.join(moddir, submoddir) ;
  this.dir = dir ;
  dirlist = [dir] ;

  this.submods = submods = {} ;

  for (pos=0;pos<dirlist.length;pos+=1) {
    dir = dirlist[pos] ;
    newDirs = _scanDir(dir, submods, regExp, recurse, defaultPriority) ;
    dirlist = dirlist.concat(newDirs) ;
  }
  
  this.list = _.sortBy(_.keys(this.submods), function (key) {
    return submods[key].priority ;
  }) ;
    
  if (this.list.length) {
    this.def = this.list[0] ;
  }
  
  this.cache = {} ;
}

SubMods.prototype.list = function list () {
  return this.list ;
} ;

SubMods.prototype.getPriority = function (name) {
  name = name || this.def ;
  return this.submods[name].priority ;
} ;

SubMods.prototype.alias = function (newname, origname) {
  origname = origname || this.def ;
  this.submods[newname] = this.submods[origname].alias(newname) ;
} ;

SubMods.prototype.preLoadAll = function preLoadAll () {
  _.each(this.submods, function (submod, name) {
    submod.load() ;
  }) ;
} ;
  
SubMods.prototype.load = function load (name) {
  name = name || this.def ;
  if (this.cache[name]) {
    return this.cache[name] ;
  } else {
    this.cache[name] = this.submods[name].load() ;
    return this.cache[name] ;
  }
} ;

SubMods.prototype.loadAllIntoObj = function loadAllIntoObj () {
  var obj = {} ;
  _.each(this.submods, function (submod, name) {
    obj[name] = submod.load() ;
  }) ;
  return obj ;
} ;

SubMods.prototype.each = function each (callback, context) {
  _.each(this.submods, callback, context) ;
} ;

SubMods.prototype.exists = function exists (name) {
  return (name in this.submods) ;
} ;


module.exports.SubMods = SubMods ;