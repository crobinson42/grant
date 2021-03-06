
var crypto = require('crypto')
var dcopy = require('deep-copy')

// oauth configuration
var oauth = require('../config/oauth.json')
// reserved keys
var reserved = require('../config/reserved.json')


// merge provider options with user options
var merge = ({provider, options = {}, server = {}, name}) => {

  // cleanup empty values in custom_params
  ;(() => {
    if (options.custom_params) {
      var params = options.custom_params
      for (var key in params) {
        if (!params[key]) {
          delete params[key]
        }
      }
      if (!Object.keys(params).length) {
        delete options.custom_params
      }
    }
  })()

  // set reserved keys
  ;(() => {
    for (var key of reserved) {
      var value = options[key] || server[key] || provider[key]
      if (value) {
        provider[key] = value
      }
    }
  })()

  // provider shortcuts
  if (name) {
    provider[name] = true
    provider.name = name
  }

  // oauth credentials
  ;(() => {
    var key, secret
    if (provider.oauth === 1) {
      key = provider.consumer_key || provider.key
      secret = provider.consumer_secret || provider.secret
    }
    else if (provider.oauth === 2) {
      key = provider.client_id || provider.key
      secret = provider.client_secret || provider.secret
    }
    if (key) {
      provider.key = key
    }
    if (secret) {
      provider.secret = secret
    }
  })()

  // oauth scope
  if (provider.scope) {
    if (provider.scope instanceof Array) {
      provider.scope = provider.scope.join(provider.scope_delimiter || ',')
    }
    else if (typeof provider.scope === 'object') {
      provider.scope = JSON.stringify(provider.scope)
    }
  }

  // custom_parameters
  ;(() => {
    if (provider.custom_parameters) {
      var params = provider.custom_params || {}
      for (var key in options) {
        if (reserved.indexOf(key) === -1 &&
            provider.custom_parameters.indexOf(key) !== -1) {

          params[key] = options[key]
        }
      }
      if (Object.keys(params).length) {
        provider.custom_params = params
      }
    }
  })()

  // static overrides
  ;(() => {
    var overrides = {}
    for (var key in options) {
      if (provider.custom_parameters &&
          provider.custom_parameters.indexOf(key) !== -1) {
        continue
      }

      if (reserved.indexOf(key) === -1 &&
          typeof options[key] === 'object') {

        overrides[key] = merge({
          provider: dcopy(provider),
          options: dcopy(options[key]),
        })
      }
    }
    if (Object.keys(overrides).length) {
      provider.overrides = overrides
    }
  })()

  return provider
}

// initialize all configured providers
var init = (config = {}) => {
  var providers = {}
  for (var name in config) {
    if (name === 'server') {
      continue
    }
    providers[name] = merge({
      provider: dcopy(oauth[name]),
      options: config[name],
      server: config.server,
      name,
    })
  }
  if (config.server) {
    providers.server = config.server
  }
  return providers
}

// oauth state transform
var state = (provider) => {
  var state
  if (/string|number/.test(typeof provider.state)) {
    state = provider.state.toString()
  }
  else if (provider.state === true) {
    state = crypto.randomBytes(10).toString('hex')
  }
  return state
}

// get provider on connect
var provider = (config, session) => {
  var name = session.provider
  var provider = config[name]

  if (!provider) {
    if (oauth[name]) {
      provider = merge({
        provider: dcopy(oauth[name]),
        server: config.server,
        name,
      })
      config[name] = provider
    }
    else {
      provider = {}
    }
  }

  if (session.override && provider.overrides) {
    var override = provider.overrides[session.override]
    if (override) {
      provider = override
    }
  }

  if (session.dynamic) {
    provider = merge({
      provider: dcopy(provider),
      options: session.dynamic,
      server: config.server,
    })
  }

  if (provider.state) {
    provider = dcopy(provider)
    provider.state = state(provider)
  }

  return provider
}

module.exports = {merge, init, state, provider}
