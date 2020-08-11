import React from 'react';
import PropTypes from 'prop-types';

import { positiveOrZero } from './utils';
import ScrollBar from './Scrollbar';

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
    this.getScrollSize = this.getScrollSize.bind(this);
    this.goToScrollbar = this.goToScrollbar.bind(this);
    this.goToContent = this.goToContent.bind(this);
    this.goToContentDirect = this.goToContentDirect.bind(this);
    this.goToScrollbarDirect = this.goToScrollbarDirect.bind(this);

    this.scrollArea = {
      scrollTop: () => {
        this.scrollTop();
      },
      scrollBottom: () => {
        this.scrollBottom();
      },
      scrollPageTop: () => {
        this.scrollPageTop();
      },
      scrollPageBottom: () => {
        this.scrollPageBottom();
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

  componentDidMount() {
    this.setSizesToState();
  }

  componentDidUpdate() {
    this.setSizesToState();
  }

  render() {
    let { children, className, contentClassName, ownerDocument } = this.props;

    let scrollbarY = this.canScrollY() ? (
      <ScrollBar
        ownerDocument={ownerDocument}
        realSize={this.state.realHeight}
        containerSize={this.state.containerHeight}
        position={this.state.topPosition}
        containerStyle={this.props.verticalContainerStyle}
        scrollbarStyle={this.props.verticalScrollbarStyle}
        smoothScrolling={false}
        minScrollSize={this.props.minScrollSize}
        goToContent={this.goToContent}
        goToContentDirect={this.goToContentDirect}
        goToScrollbarDirect={this.goToScrollbarDirect}
        goToScrollbar={this.goToScrollbar}
        computeMultiplier={this.computeMultiplier}
        type="vertical"
      />
    ) : null;

    let classes = 'scrollarea ' + (className || '');
    let contentClasses =
      'scrollarea-content pivi-scrollarea ' + (contentClassName || '');

    let contentStyle = {
      marginTop: 0,
    };

    return (
      <div
        ref={(x) => (this.wrapper = x)}
        className={classes}
        style={this.props.style}
      >
        {scrollbarY}
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
    if (this.canScrollY()) {
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

      const multiplier = this.computeMultiplier();
      this.goToScrollbar(deltaY * -multiplier);
      this.goToContent(deltaY);
    }
  }

  computeMultiplier() {
    if (this.state !== undefined) {
      return this.state.containerHeight / this.state.realHeight;
    }
  }

  getScrollSize() {
    const el = document.getElementsByClassName('pivi-scrollbar');
    if (el.length) {
      const height = parseFloat(el[0].style.height);
      return height;
    }
  }

  goToScrollbar(pos) {
    let el = document.getElementsByClassName('pivi-scrollbar');
    if (!this.canScrollY() || !el.length) {
      return;
    }
    const { containerHeight } = this.state;
    const scrollSize = this.getScrollSize();

    const currentPos = -parseFloat(el[0].style.marginTop);
    let newPos = currentPos + pos;
    const maxPos = containerHeight - scrollSize;
    const minPos = 0;

    if (newPos >= minPos) {
      newPos = 0;
    }

    if (newPos <= -maxPos) {
      newPos = -maxPos;
    }

    el[0].style.marginTop = -newPos + 'px';
  }

  goToScrollbarDirect(pos) {
    let el = document.getElementsByClassName('pivi-scrollbar');
    if (!this.canScrollY() || !el.length) {
      return;
    }
    const { containerHeight } = this.state;

    const scrollSize = this.getScrollSize();
    let newPos = pos;
    const maxPos = -containerHeight + scrollSize;
    const minPos = 0;

    if (pos >= minPos) {
      newPos = 0;
    }
    if (newPos <= maxPos) {
      newPos = maxPos;
    }
    el[0].style.marginTop = -newPos + 'px';
  }

  goToContent(pos) {
    let el = document.getElementsByClassName('pivi-scrollarea');
    if (!this.canScrollY() || !el.length) {
      return;
    }
    const { realHeight, containerHeight } = this.state;
    const currentPos = -parseFloat(el[0].style.marginTop);
    let newPos = currentPos + pos;
    const maxPos = realHeight - containerHeight;
    const minPos = 0;

    if (newPos <= minPos) {
      newPos = 0;
    }

    if (newPos >= maxPos) {
      newPos = maxPos;
    }

    el[0].style.marginTop = -newPos + 'px';
  }

  goToContentDirect(pos) {
    let el = document.getElementsByClassName('pivi-scrollarea');
    if (!this.canScrollY() || !el.length) {
      return;
    }
    const { realHeight, containerHeight } = this.state;
    let newPos = pos;
    const maxPos = realHeight - containerHeight;
    const minPos = 0;

    if (newPos <= minPos) {
      newPos = 0;
    }
    if (newPos >= maxPos) {
      newPos = maxPos;
    }

    el[0].style.marginTop = -newPos + 'px';
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

  scrollPageTop() {
    const el = document.getElementsByClassName('pivi-scrollarea');
    const currentPos = -parseFloat(el[0].style.marginTop);
    const pos = currentPos - this.state.containerHeight;
    const multiplier = this.computeMultiplier();
    this.goToScrollbarDirect(pos * -multiplier);
    this.goToContentDirect(pos);
  }

  scrollPageBottom() {
    const el = document.getElementsByClassName('pivi-scrollarea');
    const currentPos = -parseFloat(el[0].style.marginTop);
    const pos = currentPos + this.state.containerHeight;
    const multiplier = this.computeMultiplier();
    this.goToScrollbarDirect(pos * -multiplier);
    this.goToContentDirect(pos);
  }

  scrollTop() {
    this.goToScrollbarDirect(0);
    this.goToContentDirect(0);
  }

  scrollBottom() {
    this.goToScrollbarDirect(-99999999);
    this.goToContentDirect(99999999);
  }

  canScrollY(state = this.state) {
    let scrollableY = state.realHeight > state.containerHeight;
    return scrollableY && this.props.vertical;
  }

  canScrollX(state = this.state) {
    let scrollableX = state.realWidth > state.containerWidth;
    return scrollableX && this.props.horizontal;
  }

  getModifiedPositionsIfNeeded(newState) {
    let bottomPosition = newState.realHeight - newState.containerHeight;
    if (this.state.topPosition >= bottomPosition) {
      newState.topPosition = this.canScrollY(newState)
        ? positiveOrZero(bottomPosition)
        : 0;
    }

    return newState;
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
