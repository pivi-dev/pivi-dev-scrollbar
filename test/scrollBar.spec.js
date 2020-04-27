import expect from 'expect';
import expectJSX from 'expect-jsx';
expect.extend(expectJSX);

import React, { Component } from 'react';
import { render } from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import ScrollArea from '../src/js/ScrollArea';
import Scrollbar from '../src/js/Scrollbar';

function setupScrollbar(props) {
  let renderer = TestUtils.createRenderer();
  renderer.render(<Scrollbar {...props} />);
  let instance = getRendererComponentInstance(renderer);
  let output = renderer.getRenderOutput();
  let wrapper = output.props.children();

  let content = wrapper.props.children;

  return {
    wrapper,
    content,
    renderer,
    output,
    instance,
  };
}

function getRendererComponentInstance(renderer) {
  return renderer._instance ? renderer._instance._instance : null;
}

describe('ScrollBar component', () => {
  it('test 1', () => {
    expect(1).toEqual(1);
  });
});
