import React from 'react';
import TestUtils from 'react/lib/ReactTestUtils';
import Editor from '../Source/client/app/editor/presentation.js';
import StubRouterContext from '../utils/stub_router_context'

describe('editor', function() {
	it('renders the editor component', function() {
		let Subject = StubRouterContext(Editor);
		console.log('===============', Subject)
		let editor = TestUtils.renderIntoDocument(<Subject />);
		expect(editor).toBeDefined();
	})
})

