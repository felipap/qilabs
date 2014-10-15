
// partially adopted from node-open-graph

request = require('request')
cheerio = require('cheerio')
validator = require('validator')

please = require('src/lib/please.js')

function getOpenGraphAttrs (html) {
  var $ = cheerio.load(html),
      $html = $('html'),
      namespace = 'og',
      strict = false,
      shorthandProperties = {
        "image": "image:url",
        "video": "video:url",
        "audio": "audio:url"
      }

  if ($html.length) {
    var attribKeys = Object.keys($html[0].attribs)
    attribKeys.some(function (attrName) {
      var attrValue = $html.attr(attrName)
      if (attrValue.toLowerCase() === 'http://opengraphprotocol.org/schema/'
      && attrName.substring(0, 6) == 'xmlns:') {
        namespace = attrName.substring(6)
        return false
      }
    })
  } else if (strict) {
    return null
  }

  // Let the parsing begin

  var meta = {},
      metaTags = $('meta')

  metaTags.each(function () {
    var element = $(this)
        propertyAttr = element.attr('property')

    // If meta element isn't an "og:" property, skip it
    if (!propertyAttr || propertyAttr.substring(0, namespace.length) !== namespace)
      return

    var property = propertyAttr.substring(namespace.length+1),
        content = element.attr('content')

    // If property is a shorthand for a longer property, use the full property
    property = shorthandProperties[property] || property

    var key, tmp,
      ptr = meta,
      keys = property.split(':')

    // we want to leave one key to assign to so we always use references
    // as long as there's one key left, we're dealing with a sub-node and not a value

    while (keys.length > 1) {
      key = keys.shift()

      if (Array.isArray(ptr[key])) {
        // the last index of ptr[key] should become the object we are examining.
        tmp = ptr[key].length-1
        ptr = ptr[key]
        key = tmp
      }

      if (typeof ptr[key] === 'string') {
        // if it's a string, convert it
        ptr[key] = { '': ptr[key] }
      } else if (ptr[key] === undefined) {
        // create a new key
        ptr[key] = {}
      }

      // move our pointer to the next subnode
      ptr = ptr[key]
    }

    // deal with the last key
    key = keys.shift()

    if (ptr[key] === undefined) {
      ptr[key] = content
    } else if (Array.isArray(ptr[key])) {
      ptr[key].push(content)
    } else {
      ptr[key] = [ ptr[key], content ]
    }
  })

  return meta
}

function getResources (html) {
  var $ = cheerio.load(html),
      $html = $('html')

  var data = {},
      attrs = [ "image", "video", "audio" ]

  attrs.forEach(function (attr) {
    var tags = $('meta[property*="og:'+attr+'"]')
    var obj = {}
    tags.each(function () {
      var tag = $(this),
          name = tag.attr('property'),
          content = tag.attr('content')
      if (name === 'og:'+attr)
        name += ":url"
      obj[name.replace(new RegExp('^og:'+attr+':'), '')] = content
    })
    if (Object.keys(obj).length)
      data[attr] = obj
  })

  return data
}

module.exports = function (user, link, cb) {
  please({$model:'User'}, '$skip', '$isFn')

  if (!validator.isURL(link))
    return cb({ error: true, message: "Link não é uma url válida." })

  ac = user.access_token
  url = 'https://graph.facebook.com/v2.1/?id='+encodeURIComponent(link)+'&access_token='+ac

  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      data = JSON.parse(body)
      data = data.og_object || data

      if (Object.keys(data).length === 1 && 'id' in data) // Thanks for nothing.
        return cb(null, null)

      // Try to fetch resources (video, image, autdio)
      request(data.url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var tags = getResources(body)
          console.log('tags', tags)
          data.image = tags.image
          return cb(null, data)
        } else {
          return cb(null, data)
        }
      })
    } else {
      return cb(new Error("Error requesting url og from facebook."+JSON.stringify(error)))
    }
  })

}