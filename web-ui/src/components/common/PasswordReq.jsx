import React from 'react';

export default class PasswordReq extends React.PureComponent {
  render() {
    const validPasswordCls = this.props.validPassword ? '' : ' color-destructive';
    const passwordCls = ` {${this.props.className}}`;

    return (
      <div className={`color-hint password-requirements${validPasswordCls}${passwordCls}`}>
        Your password must meet the following requirements:
        <ul>
          <li>At least <b>8 characters</b></li>
          <li>Include at least <b>1 number</b></li>
          <li>Include at least <b>1 special character</b></li>
          <li>Include <b>uppercase and lowercase characters</b></li>
        </ul>
      </div>
    )
  }
}
