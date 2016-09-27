
// define([], function() {

// describe('getDiv', function() {
//     console.log('============',document)
//     var d = document.getElementById('app');
//     console.log('============',d)

//     it('Should exist', function() {
//         expect(d.nodeName).toBe('DIV');
//     });
// });

// });

// define('NumberTest', ['GetNumber'], function(getNumber) {
//     'use strict';

//     describe("Elvenware Get Plain Number Suite", function() {
        
//         // Let's test one local method. The other methods to be tested are in GetNumber
//         function getNine() {
//             return 9;
//         }
        
//         it("Call local getNine", function() {
//             expect(getNine()).toBe(9);
//         });

//         it("Call module that returns 8", function() {
//             expect(getNumber.getEight()).toBe(8);
//         });

//         it("Calls a module that returns 7", function() {
//             expect(getNumber.getSeven()).toBe(7);
//         });
//     });
// });