import expect from 'expect';
import expectJSX from 'expect-jsx';
expect.extend(expectJSX);

import React, { Component } from 'react';
import { render } from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import ScrollArea from '../src/js/ScrollArea';
import Scrollbar from '../src/js/Scrollbar';

function setup(props, sizes) {
  let renderer = TestUtils.createRenderer();
  renderer.render(
    <ScrollArea {...props}>
      <p>content</p>
    </ScrollArea>,
  );
  let instance = getRendererComponentInstance(renderer);

  if (sizes) {
    instance.computeSizes = () => sizes;
    instance.setSizesToState();
  }

  let output = renderer.getRenderOutput();

  let wrapper = output.props.children();

  let content = wrapper.props.children[0];
  let scrollbars = wrapper.props.children.filter(
    (element) => element && element.type == Scrollbar,
  );

  return {
    wrapper,
    content,
    scrollbars,
    renderer,
    output,
    instance,
  };
}

function setupComponentWithMockedSizes(props) {
  let component = setup(props, {
    realHeight: 300,
    containerHeight: 100,
    realWidth: 300,
    containerWidth: 100,
  });

  return component;
}

function getRendererComponentInstance(renderer) {
  return renderer._instance ? renderer._instance._instance : null;
}

describe('ScrollArea component', () => {
  it('test 1', () => {
    expect(1).toEqual(1);
  });
});
