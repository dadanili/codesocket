var React = require('react');
var TestUtils = require('react/lib/ReactTestUtils');
var Editor = require('../Source/client/app/editor/presentation.js');
var StubRouterContext = require('../utils/stub_router_context')

describe('editor', function() {
	it('renders the editor component', function() {
		let Subject = StubRouterContext(Editor)
		let editor = TestUtils.renderIntoDocument(<Subject />);
		expect(editor).toBeDefined();
	})
})

