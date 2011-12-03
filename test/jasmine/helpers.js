
beforeEach(function(){
  this.addMatchers({
    toBeAResourceObject: function(expected){
      var isDefined = !!this.actual
        , hasURL = !!this.actual.url && typeof this.actual.url === 'string'
      ;

      return isDefined && hasURL;
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
    }
  });
});
