var helpers = {}
;

if (typeof module === 'object' && module.exports) {
  module.exports.helpers = helpers;
}

// helpers.randomChannelName
// makes a random string to use as channel name.
helpers.randomChannelName = function(){
  return 'random channel ' + (new Date().getTime());
};

// helpers.randomEmail
// creates a random string to use as email.
helpers.randomEmail = function(){
  return 'test-' + (new Date().getTime()) + '@spire.io';
};

beforeEach(function(){
  this.addMatchers({
    toBeAResource: function(expected){
      var isDefined = !!this.actual
        , hasURL = !!this.actual.url && typeof this.actual.url === 'string'
      ;

      return isDefined && hasURL;
    },
    toBeAPrivilegedResource: function(expected){
      var isDefined = !!this.actual
        , hasURL = !!this.actual.url && typeof this.actual.url === 'string'
        , hasCapability = !!this.actual.capability
      ;

      return isDefined && hasURL && hasCapability
    },
    toIncludeASchemaFor: function(resource, version){
      var hasSchema = !!this.actual.schema
        , hasVersion = !!this.actual.schema[version]
        , hasResource = !!this.actual.schema[version][resource]
        , hasMediaType = !!this.actual
          .schema[version][resource]
          .mediaType
      ;

      return hasSchema && hasVersion && hasResource && hasMediaType;
    },
    toIncludeResource: function(resource){
      var hasResources = !!this.actual.resources
        , hasResource = !! this.actual.resources[resource]
        , resource = this.actual.resources[resource]
        , hasResourceURL
      ;
      if (resource){
        hasResourceURL = resource.url && typeof resource.url === 'string'
      } else {
        hasResourceURL = false;
      }

      return hasResources && hasResource && hasResourceURL;
    },
    toHaveACapability: function(){
      var capability = this.actual.capability;

      return !!capability && typeof capability === 'string'
    },
    toBeAResourceObject: function(){
      console.log(this.actual.constructor.name);
      return this.actual && this.actual.constructor && this.actual.constructor.name === 'Resource';
    },
  });
});

helpers.shred = {
  methods: ['get', 'put', 'post', 'delete'],
  forEachMethod: function(fn) {
    for (var i = 0; i < this.methods.length; i++){
      var method = this.methods[i];
      fn(method);
    }
  },
  stub: function (shred, sinon, options) {
    this.forEachMethod(function (method) {
      sinon.stub(shred, method, function(options){
        return options.on.error({status: 666});
      });
    });
  },
  restore: function (shred) {
    this.forEachMethod(function (method) {
      shred[method].restore();
    });
  }
};
