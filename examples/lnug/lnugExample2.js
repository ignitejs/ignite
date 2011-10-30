var _ = require('underscore') ;
var colors = require('colors') ;

function lnugExample (fire, name) {
  // Closure: local variables are available across states:
  var languages = {} ;
  
  return {
    startState: "Welcome",
    
    states: {
      
      "Welcome": {
        entry: function () {
          console.log("Welcome. I'm searching for: '%s'", name) ;
          return "GetTweets" ;
        }
      },
      
      "GetTweets": {
        entry: function () {
          fire.request("http://search.twitter.com/search.json?"+
                    "q="+name+
                    "&result_type=mixed") ;
        },
        timeout: 2000,
        actions: {
          "request.err": "@error",
          "request.done": "HandleResult",
          "timeout": function () {
            console.log("Sorry, but Twitter are taking a long time to reply.") ;
            return "@exit" ;
          }
        }
      },
      
      "HandleResult": {
        entry: function (response, body) {
          body = JSON.parse(body) ;
          console.log("Completed in: ", body.completed_in) ;
          _.each(body.results, function (result) {
            languages[result.iso_language_code] = 
              (languages[result.iso_language_code] || 0) + 1 ;
          }) ;
          if (body.results.length) {
            return ["GetProfileImages", body.results] ;
          } else {
            return "@exit" ;
          }
        }
      },
      
      "GetProfileImages": {
        map: {
          fn: "request.get",
          fnArgs: function (result) {
            return { url: result.profile_image_url } ;
          },
          iterator: function (response, body) {
            return body.toString() ;
          }
        },
        actions: {
          "map.done": function (images, results, errors) {
            _.each(results, function (result, index) {
              var image = errors[index] ? "" : images[index] ;
              var fromTo = result.from_user.bold.red + " -> " ;
              fromTo += (result.to_user ? result.to_user : "[Everyone]").blue ;
              console.log("%d: %s Img len: %d\n   '%s'", index, fromTo, image.length, result.text.green) ;
            }) ;
            return "DumpLanguages" ;
          }
        }
      },
      
      "DumpLanguages": {
        entry: function () {
          console.log("\nLanguage counts:") ;
          _.each(languages, function (count, lang) {
            console.log("  %s: %d", lang, count) ;
          }) ;
          return "@exit" ;
        }
      }
    }
  } ;
}

lnugExample.defaults = {
  imports: { 
    request: require('request')
  },
  args: [ '#lnug' ]
};

module.exports = lnugExample;