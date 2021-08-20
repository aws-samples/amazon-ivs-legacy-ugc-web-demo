import React from "react";
import PropTypes from "prop-types";
import { COLOR_LIST } from "../../constants";

const BgColor = (props) => {
  const renderColor = () => {
    return COLOR_LIST.map((bgColor) => {
      const selected = bgColor.name === props.bgColor ? " selected" : "";
      const divStyle = { backgroundColor: bgColor.color };

      return (
        <div
          style={divStyle}
          className={`item-container item-container--square-items${selected}`}
          onClick={(e) => props.handleColorClick(e, bgColor.name)}
          key={bgColor.id}
        >
          <div className={`item item--color${selected}`} />
          {selected && (
            <div className="item-selected-wrapper">
              <svg
                className="icon icon--selected"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.67L4.83 12.5L3.41 13.91L9 19.5L21 7.49997L19.59 6.08997L9 16.67Z" />
              </svg>
            </div>
          )}
        </div>
      );
    });
  };

  return <>{renderColor()}</>;
};

BgColor.propTypes = {
  bgColor: PropTypes.string,
  handleColorClick: PropTypes.func,
};

export default BgColor;
