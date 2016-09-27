var context = require.context('./Spec', true, /Test\.js$/);
context.keys().forEach(context);