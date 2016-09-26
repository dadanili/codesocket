console.log('i am in unit test')

define(['app', 'jquery', 'underscore'], function(App, $, _) {

	describe('getDiv', function() {
	    var d = document.querySelector('#app');

	    it('Should exist', function() {
	        expect(d.nodeName).toBe('DIV');
	    });
	});

});