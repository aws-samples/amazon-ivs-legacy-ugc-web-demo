import React from 'react';
import PropTypes from 'prop-types';
import { COLOR_LIST } from '../../constants';

class BgColor extends React.Component {

  renderColor = () => {
    return COLOR_LIST.map(bgColor => {
      const selected = bgColor.name === this.props.bgColor ? ' selected' : '';
      const divStyle = { backgroundColor: bgColor.color };

      return (
        <div className={`item-container item-container--square-items${selected}`} key={bgColor.id}>
          <div
            style={divStyle}
            className={`item item--color${selected}`}
            onClick={(e) => this.props.handleColorClick(e, bgColor.name)}
          />
          {selected &&
            <div className="item-selected-wrapper">
              <svg className="icon icon--selected" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M9 16.67L4.83 12.5L3.41 13.91L9 19.5L21 7.49997L19.59 6.08997L9 16.67Z"/></svg>
            </div>
          }
        </div>
      )}
    )
  }

  render() {
    return (
      <React.Fragment>
        {this.renderColor()}
      </React.Fragment>
    )
  }
}

BgColor.propTypes = {
  bgColor: PropTypes.string,
  handleColorClick: PropTypes.func
};

export default BgColor;
