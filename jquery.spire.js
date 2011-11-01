
(function($){
  $.spire = {
    options: { url: 'http://api.spire.io' },
    requests: {
      // Makes the discovery request to the spire.io API, triggers the passed
      // in callback.
      /*

      discovery(function(err, ))

      */
      description: function(callback){
        $.ajax({ type: 'GET'
          , url: $.spire.options.url
          , dataType: 'json'
          , error: function(xhr, status, errorThrown){
              // throw new Error('Problem with the spire.io discovery request');
            }
            // xhr handlers always get executed on the window, I tried to
            // write a nice wrapper to help with testing but all it's methods
            // were getting called with `this` bound to the window
          , success: function(description, status, xhr){
              console.log('description', description);
              callback(null, description);
            }
        });
      }
    }
  };
})(jQuery);