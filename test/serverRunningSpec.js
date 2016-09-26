var expect = require('chai').expect;
var server = require('../server/server.js');
var supertest = require('supertest');

var request = supertest.agent(server);

describe('server', function() {
  describe('GET /', function () {
    it('should return 200', function (done) {
      // just assume that if it contains an <input> tag its index.html
      request
        .get('/')
        .expect(200, /<input/, done);
    });
  });
});
