import React from "react";
import PropTypes from "prop-types";
import { AVATAR_LIST } from "../../constants";

const Avatars = ({ handleAvatarClick, currentAvatar }) => {
  return (
    <>
      {AVATAR_LIST.map((avatar) => {
        const selected = avatar.name === currentAvatar ? " selected" : "";
        return (
          <div
            className={`item-container item-container--square-items${selected}`}
            key={avatar.id}
          >
            <img
              className={`item item--avatar${selected}`}
              src={`${process.env.PUBLIC_URL}/${avatar.image}`}
              alt={avatar.image}
              onClick={(e) => handleAvatarClick(e, avatar.name)}
            />
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
      })}
    </>
  );
};

Avatars.propTypes = {
  currentAvatar: PropTypes.string,
  handleAvatarClick: PropTypes.func,
};

export default Avatars;
