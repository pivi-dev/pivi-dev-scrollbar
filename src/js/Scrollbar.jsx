import React from 'react';
import PropTypes from 'prop-types';

class ScrollBar extends React.Component {
  constructor(props) {
    super(props);
    let newState = this.calculateState(props);
    this.scrollSize = newState.scrollSize;
    this.position = newState.position;
    this.lastClientPosition = 0;
    this.isDragging = false;

    if (props.type === 'vertical') {
      this.bindedHandleTouchMove = this.handleTouchMoveForVertical.bind(this);
      this.bindedHandleMouseMove = this.handleMouseMoveForVertical.bind(this);
    }
    this.bindedHandleTouchUp = this.handleTouchUp.bind(this);
    this.bindedHandleMouseUp = this.handleMouseUp.bind(this);
  }

  componentDidMount() {
    if (this.props.ownerDocument) {
      this.props.ownerDocument.addEventListener(
        'touchmove',
        this.bindedHandleTouchMove,
      );
      this.props.ownerDocument.addEventListener(
        'touchend',
        this.bindedHandleTouchUp,
      );
      this.props.ownerDocument.addEventListener(
        'mousemove',
        this.bindedHandleMouseMove,
      );
      this.props.ownerDocument.addEventListener(
        'mouseup',
        this.bindedHandleMouseUp,
      );
    }
  }

  componentWillReceiveProps(nextProps) {
    const newState = this.calculateState(nextProps);
    this.position = newState.position;
    this.scrollSize = newState.scrollSize;
  }

  componentWillUnmount() {
    if (this.props.ownerDocument) {
      this.props.ownerDocument.removeEventListener(
        'mousemove',
        this.bindedHandleTouchMove,
      );
      this.props.ownerDocument.removeEventListener(
        'touchend',
        this.bindedHandleTouchUp,
      );
      this.props.ownerDocument.removeEventListener(
        'mousemove',
        this.bindedHandleMouseMove,
      );
      this.props.ownerDocument.removeEventListener(
        'mouseup',
        this.bindedHandleMouseUp,
      );
    }
  }

  calculateFractionalPosition(realContentSize, containerSize, contentPosition) {
    let relativeSize = realContentSize - containerSize;

    return 1 - (relativeSize - contentPosition) / relativeSize;
  }

  calculateState(props) {
    let fractionalPosition = this.calculateFractionalPosition(
      props.realSize,
      props.containerSize,
      props.position,
    );
    let proportionalToPageScrollSize =
      (props.containerSize * props.containerSize) / props.realSize;
    let scrollSize =
      proportionalToPageScrollSize < props.minScrollSize
        ? props.minScrollSize
        : proportionalToPageScrollSize;

    let scrollPosition =
      (props.containerSize - scrollSize) * fractionalPosition;
    return {
      scrollSize: scrollSize,
      position: Math.round(scrollPosition),
    };
  }

  render() {
    let { type, scrollbarStyle, containerStyle } = this.props;
    let isVoriziontal = type === 'horizontal';
    let isVertical = type === 'vertical';
    let scrollStyles = this.createScrollStyles();

    let scrollbarClasses = `scrollbar-container ${
      this.isDragging ? 'active' : ''
    } ${isVoriziontal ? 'horizontal' : ''} ${isVertical ? 'vertical' : ''}`;

    console.log('Scrollbar render');

    return (
      <div
        className={scrollbarClasses}
        style={containerStyle}
        onTouchStart={this.handleScrollBarContainerTouch.bind(this)}
        onMouseDown={this.handleScrollBarContainerClick.bind(this)}
        ref={(x) => (this.scrollbarContainer = x)}
      >
        <div
          className="scrollbar scrollbar-handle"
          style={{ ...scrollbarStyle, ...scrollStyles }}
          onTouchStart={this.handleTouchStart.bind(this)}
          onMouseDown={this.handleMouseDown.bind(this)}
        />
      </div>
    );
  }

  handleScrollBarContainerClick(e) {
    e.preventDefault();
    let multiplier = this.computeMultiplier();
    let clientPosition = this.isVertical() ? e.clientY : e.clientX;
    let { top, left } = this.scrollbarContainer.getBoundingClientRect();
    let clientScrollPosition = this.isVertical() ? top : left;

    let position = clientPosition - clientScrollPosition;
    let proportionalToPageScrollSize =
      (this.props.containerSize * this.props.containerSize) /
      this.props.realSize;
    this.isDragging = true;
    this.lastClientPosition = clientPosition;
    // this.props.onPositionChange(
    //   (position - proportionalToPageScrollSize / 2) / multiplier,
    // );
  }

  handleScrollBarContainerTouch(e) {
    e.preventDefault();
    let multiplier = this.computeMultiplier();
    let clientPosition = this.isVertical()
      ? e.changedTouches[0].clientY
      : e.changedTouches[0].clientX;
    let { top, left } = this.scrollbarContainer.getBoundingClientRect();
    let clientScrollPosition = this.isVertical() ? top : left;

    let position = clientPosition - clientScrollPosition;
    let proportionalToPageScrollSize =
      (this.props.containerSize * this.props.containerSize) /
      this.props.realSize;
    this.isDragging = true;
    this.lastClientPosition = clientPosition;
    // this.props.onPositionChange(
    //   (position - proportionalToPageScrollSize / 2) / multiplier,
    // );
    if (e.target.classList.contains('scrollbar-container')) {
      const state = this.props.getState();
      this.props.goToScrollbarDirect(-position, state);
      this.props.goToContentDirect(
        (position - proportionalToPageScrollSize / 2) / multiplier,
        state,
      );
    }
  }

  handleMouseMoveForVertical(e) {
    let multiplier = this.computeMultiplier();

    if (this.isDragging) {
      e.preventDefault();
      let deltaY = this.lastClientPosition - e.clientY;
      this.lastClientPosition = e.clientY;
      this.props.onMove(deltaY / multiplier, 0);
    }
  }

  handleTouchMoveForVertical(e) {
    let multiplier = this.computeMultiplier();

    if (this.isDragging && e.target.classList.contains('scrollbar-handle')) {
      e.stopPropagation();
      let deltaY = this.lastClientPosition - e.touches[0].clientY;
      this.lastClientPosition = e.touches[0].clientY;
      // this.props.onMove(deltaY / multiplier, 0);
      // scrollarea-content this.content.style.marginTop;
      // document.getElementsByClassName('scrollarea-content')[0].style.marginTop;

      // console.log('lemon2s', this.calculateState());
      // console.log(this);
      const state = this.props.getState();
      this.props.goToContent(-deltaY / multiplier, state);
      this.props.goToScrollbar(deltaY, state);
      // console.log('calculateState', this.calculateState());

      // this.props.goToContent(deltaY / multiplier);
      // this.goTo(-deltaY);
    }
  }

  handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    let lastClientPosition = this.isVertical() ? e.clientY : e.clientX;
    this.isDragging = true;
    this.lastClientPosition = lastClientPosition;

    this.props.onFocus();
  }

  handleTouchStart(e) {
    e.preventDefault();
    e.stopPropagation();
    // console.log('handleTouchStart');
    let lastClientPosition = this.isVertical()
      ? e.changedTouches[0].clientY
      : e.changedTouches[0].clientX;
    this.isDragging = true;
    this.lastClientPosition = lastClientPosition;

    this.props.onFocus();
  }

  handleMouseUp(e) {
    if (this.isDragging) {
      e.preventDefault();
      this.isDragging = false;
    }
  }

  handleTouchUp(e) {
    if (this.isDragging) {
      e.preventDefault();
      this.isDragging = false;
    }
  }

  createScrollStyles() {
    if (this.props.type === 'vertical') {
      return {
        height: this.scrollSize,
        marginTop: this.position,
      };
    } else {
      return {
        width: this.scrollSize,
        marginLeft: this.position,
      };
    }
  }

  computeMultiplier() {
    return this.props.containerSize / this.props.realSize;
  }

  isVertical() {
    return this.props.type === 'vertical';
  }
}

ScrollBar.propTypes = {
  onMove: PropTypes.func,
  onPositionChange: PropTypes.func,
  onFocus: PropTypes.func,
  realSize: PropTypes.number,
  containerSize: PropTypes.number,
  position: PropTypes.number,
  containerStyle: PropTypes.object,
  scrollbarStyle: PropTypes.object,
  type: PropTypes.oneOf(['vertical', 'horizontal']),
  ownerDocument: PropTypes.any,
  smoothScrolling: PropTypes.bool,
  minScrollSize: PropTypes.number,
};

ScrollBar.defaultProps = {
  type: 'vertical',
  smoothScrolling: false,
};

export default ScrollBar;
