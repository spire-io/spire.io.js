describe('$.spire', function(){
  it('should exist', function(){
    expect($.spire).toBeDefined();
  });

  describe('$.spire.options', function(){
    it('should exist', function(){
      expect($.spire.options).toBeDefined();
    });

    it('should have a `url` property', function(){
      expect($.spire.options.url).toBeDefined();
    });

    it('should have a `version` property', function(){
      expect($.spire.options.version).toBeDefined();
    });

    it('should have a `timeout` property', function(){
      expect($.spire.options.timeout).toBeDefined();
    });
  }); // describe('$.spire.options', ...

  describe('$.spire.headers', function(){
    it('should exist', function(){
      expect($.spire.headers).toBeDefined();
    });
  }); // describe('$.spire.headers', ...

  describe('$.spire.messages', function(){
    it('should exist', function(){
      expect($.spire.messages).toBeDefined();
    });
  }); // describe('$.spire.messages', ...

  describe('$.spire.accounts', function(){
    it('should exist', function(){
      expect($.spire.accounts).toBeDefined();
    });
  }); // describe('$.spire.accounts', ...

  describe('$.spire.requests', function(){
    describe('$.spire.requests.description', function(){
      it('should exist', function(){
        expect($.spire.requests.description).toBeDefined();
      });
    }); // describe('$.spire.requests.description', ...

    describe('$.spire.requests.sessions', function(){
      it('should exist', function(){
        expect($.spire.requests.sessions).toBeDefined();
      });
    }); // describe('$.spire.requests.sessions', ...

    describe('$.spire.requests.channels', function(){
      it('should exist', function(){
        expect($.spire.requests.channels).toBeDefined();
      });
    }); // describe('$.spire.requests.channels', ...

    describe('$.spire.requests.subscriptions', function(){
      it('should exist', function(){
        expect($.spire.requests.subscriptions).toBeDefined();
      });
    }); // describe('$.spire.requests.subscriptions', ...

    describe('$.spire.requests.messages', function(){
      it('should exist', function(){
        expect($.spire.requests.messages).toBeDefined();
      });
    }); // describe('$.spire.requests.messages', ...

    describe('$.spire.requests.accounts', function(){
      it('should exist', function(){
        expect($.spire.requests.accounts).toBeDefined();
      });
    }); // describe('$.spire.requests.accounts', ...
  }); // describe('$.spire.requests', ...
});
