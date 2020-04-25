import React from 'react';
import PropTypes from 'prop-types';
import lineHeight from 'line-height';

import {
  findDOMNode,
  warnAboutFunctionChild,
  warnAboutElementChild,
  positiveOrZero,
} from './utils';
import ScrollBar from './Scrollbar';

const eventTypes = {
  wheel: 'wheel',
  api: 'api',
  touch: 'touch',
  touchEnd: 'touchEnd',
  mousemove: 'mousemove',
  keyPress: 'keypress',
};

export default class ScrollArea extends React.Component {
  constructor(props) {
    super(props);
    this.total = 0;
    this.state = {
      topPosition: 0,
      leftPosition: 0,
      realHeight: 0,
      containerHeight: 0,
      realWidth: 0,
      containerWidth: 0,
    };
    this.getState = this.getState.bind(this);
    this.getScrollSize = this.getScrollSize.bind(this);
    this.goToScrollbar = this.goToScrollbar.bind(this);
    this.goToContent = this.goToContent.bind(this);
    this.goToContentDirect = this.goToContentDirect.bind(this);
    this.goToScrollbarDirect = this.goToScrollbarDirect.bind(this);

    this.scrollArea = {
      refresh: () => {
        this.setSizesToState();
      },
      scrollTop: () => {
        this.scrollTop();
      },
      scrollBottom: () => {
        this.scrollBottom();
      },
      scrollYTo: (position) => {
        this.scrollYTo(position);
      },
      scrollLeft: () => {
        this.scrollLeft();
      },
      scrollRight: () => {
        this.scrollRight();
      },
      scrollXTo: (position) => {
        this.scrollXTo(position);
      },
    };

    this.evntsPreviousValues = {
      clientX: 0,
      clientY: 0,
      deltaX: 0,
      deltaY: 0,
    };
  }

  getChildContext() {
    return {
      scrollArea: this.scrollArea,
    };
  }

  getScrollSize() {
    let proportionalToPageScrollSize =
      (this.props.containerSize * this.props.containerSize) /
      this.props.realSize;

    let scrollSize =
      proportionalToPageScrollSize < this.props.minScrollSize
        ? this.props.minScrollSize
        : proportionalToPageScrollSize;

    return -scrollSize;
  }

  componentDidMount() {
    this.lineHeightPx = lineHeight(findDOMNode(this.content));
    this.setSizesToState();
  }

  componentDidUpdate() {
    this.setSizesToState();
  }

  render() {
    let { children, className, contentClassName, ownerDocument } = this.props;

    console.log('ScrollArea render');

    let scrollbarY = this.canScrollY() ? (
      <ScrollBar
        ownerDocument={ownerDocument}
        realSize={this.state.realHeight}
        containerSize={this.state.containerHeight}
        position={this.state.topPosition}
        onMove={this.handleScrollbarMove.bind(this)}
        onPositionChange={this.handleScrollbarYPositionChange.bind(this)}
        containerStyle={this.props.verticalContainerStyle}
        scrollbarStyle={this.props.verticalScrollbarStyle}
        smoothScrolling={false}
        minScrollSize={this.props.minScrollSize}
        onFocus={this.focusContent.bind(this)}
        goToContent={this.goToContent}
        goToContentDirect={this.goToContentDirect}
        goToScrollbarDirect={this.goToScrollbarDirect}
        goToScrollbar={this.goToScrollbar}
        getState={this.getState}
        computeMultiplier={this.computeMultiplier}
        type="vertical"
      />
    ) : null;

    if (typeof children === 'function') {
      warnAboutFunctionChild();
      children = children();
    } else {
      warnAboutElementChild();
    }

    let classes = 'scrollarea ' + (className || '');
    let contentClasses = 'scrollarea-content ' + (contentClassName || '');

    let contentStyle = {
      marginTop: -this.state.topPosition,
      // marginLeft: -this.state.leftPosition,
    };

    return (
      <div
        ref={(x) => (this.wrapper = x)}
        className={classes}
        style={this.props.style}
      >
        <div
          ref={(x) => (this.content = x)}
          style={{ ...this.props.contentStyle, ...contentStyle }}
          className={contentClasses}
          onTouchStart={this.handleTouchStart.bind(this)}
          onTouchMove={this.handleTouchMove.bind(this)}
          tabIndex={this.props.focusableTabIndex}
        >
          {children}
        </div>
        {scrollbarY}
      </div>
    );
  }

  setStateFromEvent(newState, eventType) {
    if (this.props.onScroll) {
      this.props.onScroll(newState);
    }
    this.setState({ ...newState, eventType });
  }

  handleTouchStart(e) {
    let { touches } = e;
    if (touches.length === 1) {
      let { clientX, clientY } = touches[0];

      this.eventPreviousValues = {
        ...this.eventPreviousValues,
        clientY,
        clientX,
        timestamp: Date.now(),
      };
    }
  }

  handleTouchMove(e) {
    if (this.canScroll()) {
      e.preventDefault();
      e.stopPropagation();
    }

    let { touches } = e;
    if (touches.length === 1) {
      let { clientX, clientY } = touches[0];

      let deltaY = this.eventPreviousValues.clientY - clientY;
      let deltaX = this.eventPreviousValues.clientX - clientX;

      this.eventPreviousValues = {
        ...this.eventPreviousValues,
        deltaY,
        deltaX,
        clientY,
        clientX,
        timestamp: Date.now(),
      };

      const newState = this.composeNewState(-deltaX, -deltaY);
      const multiplier = this.computeMultiplier();
      this.goToScrollbar(deltaY * -multiplier);
      this.goToContent(deltaY);

      this.topPosition = newState.topPosition;
    }
  }

  handleScrollbarMove(deltaY, deltaX) {
    // const newState = this.composeNewState(deltaX, deltaY);
    // this.setStateFromEvent(newState);
  }

  // goTo() {
  //   this.content.style.marginTop = -this.total + 'px';
  // }

  computeMultiplier() {
    if (this.state !== undefined) {
      return this.state.containerHeight / this.state.realHeight;
    }
  }

  getScrollSize() {
    let el = document.getElementsByClassName('scrollbar-handle')[0];
    const height = parseFloat(el.style.height);
    return height;
  }

  getState() {
    return this.state;
  }

  getScrollContentEl() {
    return document.getElementsByClassName('scrollarea-content')[0];
  }

  // ---

  goToScrollbar(pos) {
    let el = document.getElementsByClassName('scrollbar')[0];
    const { containerHeight } = this.state;
    const scrollSize = this.getScrollSize();

    const currentPos = -parseFloat(el.style.marginTop);
    let newPos = currentPos + pos;
    const maxPos = containerHeight - scrollSize;
    const minPos = 0;

    if (newPos >= minPos) {
      newPos = 0;
    }

    if (newPos <= -maxPos) {
      newPos = -maxPos;
    }

    // console.log('newPos: ' + newPos + ' maxPos: ' + maxPos);

    return (el.style.marginTop = -newPos + 'px');
  }

  goToScrollbarDirect(pos) {
    const { containerHeight } = this.state;
    let el = document.getElementsByClassName('scrollbar')[0];
    const scrollSize = this.getScrollSize();
    let newPos = pos;
    const maxPos = -containerHeight + scrollSize;
    const minPos = 0;

    console.log('newPos: ' + newPos + ' maxPos: ' + maxPos + ' pos: ' + pos);
    if (pos >= minPos) {
      newPos = 0;
    }
    if (newPos <= maxPos) {
      newPos = maxPos;
    }
    el.style.marginTop = -newPos + 'px';
  }

  goToContent(pos) {
    let el = document.getElementsByClassName('scrollarea-content')[0];
    const { realHeight, containerHeight } = this.state;
    const currentPos = -parseFloat(el.style.marginTop);
    let newPos = currentPos + pos;
    const maxPos = realHeight - containerHeight;
    const minPos = 0;

    if (newPos <= minPos) {
      newPos = 0;
    }

    if (newPos >= maxPos) {
      newPos = maxPos;
    }

    el.style.marginTop = -newPos + 'px';
  }

  goToContentDirect(pos) {
    let el = document.getElementsByClassName('scrollarea-content')[0];
    const { realHeight, containerHeight } = this.state;
    const scrollSize = this.getScrollSize();
    let newPos = pos + scrollSize + 80;
    const maxPos = realHeight - containerHeight;
    const minPos = 0;

    // console.log(
    //   'newPos: ' + newPos + ' maxPos: ' + maxPos + ' minPos: ' + minPos,
    // );
    if (newPos <= minPos) {
      newPos = 0;
    }
    if (newPos >= maxPos) {
      newPos = maxPos;
    }

    el.style.marginTop = -newPos + 'px';
  }

  // ---

  handleScrollbarXPositionChange(position) {
    this.scrollXTo(position);
  }

  handleScrollbarYPositionChange(position) {
    this.scrollYTo(position);
  }

  composeNewState(deltaX, deltaY) {
    let newState = this.computeSizes();

    if (this.canScrollY(newState)) {
      newState.topPosition = this.computeTopPosition(deltaY, newState);
    } else {
      newState.topPosition = 0;
    }
    if (this.canScrollX(newState)) {
      newState.leftPosition = this.computeLeftPosition(deltaX, newState);
    }

    return newState;
  }

  computeTopPosition(deltaY, sizes) {
    let newTopPosition = this.state.topPosition - deltaY;
    return this.normalizeTopPosition(newTopPosition, sizes);
  }

  computeLeftPosition(deltaX, sizes) {
    let newLeftPosition = this.state.leftPosition - deltaX;
    return this.normalizeLeftPosition(newLeftPosition, sizes);
  }

  normalizeTopPosition(newTopPosition, sizes) {
    if (newTopPosition > sizes.realHeight - sizes.containerHeight) {
      newTopPosition = sizes.realHeight - sizes.containerHeight;
    }
    if (newTopPosition < 0) {
      newTopPosition = 0;
    }
    return newTopPosition;
  }

  normalizeLeftPosition(newLeftPosition, sizes) {
    if (newLeftPosition > sizes.realWidth - sizes.containerWidth) {
      newLeftPosition = sizes.realWidth - sizes.containerWidth;
    } else if (newLeftPosition < 0) {
      newLeftPosition = 0;
    }

    return newLeftPosition;
  }

  computeSizes() {
    let realHeight = this.content.offsetHeight;
    let containerHeight = this.wrapper.offsetHeight;
    let realWidth = this.content.offsetWidth;
    let containerWidth = this.wrapper.offsetWidth;

    return {
      realHeight: realHeight,
      containerHeight: containerHeight,
      realWidth: realWidth,
      containerWidth: containerWidth,
    };
  }

  setSizesToState() {
    let sizes = this.computeSizes();
    if (
      sizes.realHeight !== this.state.realHeight ||
      sizes.realWidth !== this.state.realWidth
    ) {
      this.setStateFromEvent(this.getModifiedPositionsIfNeeded(sizes));
    }
  }

  scrollTop() {
    this.scrollYTo(0);
  }

  scrollBottom() {
    this.scrollYTo(this.state.realHeight - this.state.containerHeight);
  }

  scrollLeft() {
    this.scrollXTo(0);
  }

  scrollRight() {
    this.scrollXTo(this.state.realWidth - this.state.containerWidth);
  }

  scrollYTo(pos) {
    if (this.canScrollY()) {
      // let position = this.normalizeTopPosition(
      //   topPosition,
      //   this.computeSizes(),
      // );
      // this.setStateFromEvent({ topPosition: position }, eventTypes.api);
      document.getElementsByClassName('scrollbar')[0].style.marginTop =
        pos + 'px';
    }
  }

  scrollXTo(leftPosition) {
    if (this.canScrollX()) {
      let position = this.normalizeLeftPosition(
        leftPosition,
        this.computeSizes(),
      );
      this.setStateFromEvent({ leftPosition: position }, eventTypes.api);
    }
  }

  canScrollY(state = this.state) {
    let scrollableY = state.realHeight > state.containerHeight;
    return scrollableY && this.props.vertical;
  }

  canScrollX(state = this.state) {
    let scrollableX = state.realWidth > state.containerWidth;
    return scrollableX && this.props.horizontal;
  }

  canScroll(state = this.state) {
    return this.canScrollY(state) || this.canScrollX(state);
  }

  getModifiedPositionsIfNeeded(newState) {
    let bottomPosition = newState.realHeight - newState.containerHeight;
    if (this.state.topPosition >= bottomPosition) {
      newState.topPosition = this.canScrollY(newState)
        ? positiveOrZero(bottomPosition)
        : 0;
    }

    let rightPosition = newState.realWidth - newState.containerWidth;
    if (this.state.leftPosition >= rightPosition) {
      newState.leftPosition = this.canScrollX(newState)
        ? positiveOrZero(rightPosition)
        : 0;
    }

    return newState;
  }

  focusContent() {
    if (this.content) {
      findDOMNode(this.content).focus();
    }
  }
}

ScrollArea.childContextTypes = {
  scrollArea: PropTypes.object,
};

ScrollArea.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  speed: PropTypes.number,
  contentClassName: PropTypes.string,
  contentStyle: PropTypes.object,
  vertical: PropTypes.bool,
  verticalContainerStyle: PropTypes.object,
  verticalScrollbarStyle: PropTypes.object,
  horizontal: PropTypes.bool,
  horizontalContainerStyle: PropTypes.object,
  horizontalScrollbarStyle: PropTypes.object,
  onScroll: PropTypes.func,
  contentWindow: PropTypes.any,
  ownerDocument: PropTypes.any,
  smoothScrolling: PropTypes.bool,
  minScrollSize: PropTypes.number,
  swapWheelAxes: PropTypes.bool,
  stopScrollPropagation: PropTypes.bool,
  focusableTabIndex: PropTypes.number,
};

ScrollArea.defaultProps = {
  speed: 1,
  vertical: true,
  horizontal: false,
  smoothScrolling: false,
  swapWheelAxes: false,
  contentWindow: typeof window === 'object' ? window : undefined,
  ownerDocument: typeof document === 'object' ? document : undefined,
  focusableTabIndex: 1,
};
