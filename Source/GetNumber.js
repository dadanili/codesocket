define('GetNumber', function() {
    'use strict';
    console.log('i am in GetNumber')
    return {
        getEight: function() {
            return 8;
        },
        getSeven: function() {
            return 7;
        },
        displayGetEight: function() {
            $('#getEightSpan').html(this.getEight());
        }
    };
});