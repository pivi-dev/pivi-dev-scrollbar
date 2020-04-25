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

    let scrollbarClasses = `pivi-scrollbar-container scrollbar-container ${
      this.isDragging ? 'active' : ''
    } ${isVoriziontal ? 'horizontal' : ''} ${isVertical ? 'vertical' : ''}`;

    return (
      <div
        className={scrollbarClasses}
        style={containerStyle}
        onTouchStart={this.handleScrollBarContainerTouch.bind(this)}
        onMouseDown={this.handleScrollBarContainerClick.bind(this)}
        ref={(x) => (this.scrollbarContainer = x)}
      >
        <div
          className="scrollbar pivi-scrollbar scrollbar-handle"
          style={{ ...scrollbarStyle, ...scrollStyles }}
          onTouchStart={this.handleTouchStart.bind(this)}
          onMouseDown={this.handleMouseDown.bind(this)}
        />
      </div>
    );
  }

  handleScrollBarContainerClick(e) {
    e.preventDefault();
    e.stopPropagation();
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

    if (e.target.classList.contains('pivi-scrollbar-container')) {
      let x = (position - proportionalToPageScrollSize / 2) / multiplier;
      let p = this.props.containerSize / 2;
      let y = x + p;
      this.props.goToScrollbarDirect(-position);
      this.props.goToContentDirect(y);
    }
  }

  handleScrollBarContainerTouch(e) {
    e.preventDefault();
    e.stopPropagation();
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

    if (e.target.classList.contains('pivi-scrollbar-container')) {
      let x = (position - proportionalToPageScrollSize / 2) / multiplier;
      let p = this.props.containerSize / 2;
      let y = x + p;
      this.props.goToScrollbarDirect(-position);
      this.props.goToContentDirect(y);
    }
  }

  handleMouseMoveForVertical(e) {
    e.stopPropagation();
    e.stopPropagation();

    if (this.isDragging && e.target.classList.contains('pivi-scrollbar')) {
      const multiplier = this.computeMultiplier();
      const deltaY = this.lastClientPosition - e.clientY;
      this.lastClientPosition = e.clientY;
      this.props.goToContent(-deltaY / multiplier);
      this.props.goToScrollbar(deltaY);
    }
  }

  handleTouchMoveForVertical(e) {
    e.stopPropagation();
    e.stopPropagation();

    if (this.isDragging && e.target.classList.contains('pivi-scrollbar')) {
      const multiplier = this.computeMultiplier();
      const deltaY = this.lastClientPosition - e.touches[0].clientY;
      this.lastClientPosition = e.touches[0].clientY;
      this.props.goToContent(-deltaY / multiplier);
      this.props.goToScrollbar(deltaY);
    }
  }

  handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    let lastClientPosition = this.isVertical() ? e.clientY : e.clientX;
    this.isDragging = true;
    this.lastClientPosition = lastClientPosition;
  }

  handleTouchStart(e) {
    e.preventDefault();
    e.stopPropagation();
    let lastClientPosition = e.changedTouches[0].clientY;
    this.isDragging = true;
    this.lastClientPosition = lastClientPosition;
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
    }
  }

  computeMultiplier() {
    return this.props.containerSize / this.props.realSize;
  }

  isVertical() {
    return true;
  }
}

ScrollBar.propTypes = {
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
