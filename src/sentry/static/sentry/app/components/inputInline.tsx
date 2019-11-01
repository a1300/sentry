import React from 'react';
import styled from 'react-emotion';

import {callIfFunction} from 'app/utils/callIfFunction';

import InlineSvg from 'app/components/inlineSvg';
import space from 'app/styles/space';

type Props = {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;

  placeholder?: string;
  value?: string;
} & React.DOMAttributes<HTMLDivElement>;

type State = {
  isFocused: boolean;
  isHovering: boolean;
};

/**
 * InputInline is a cool pattern and @doralchan has confirmed that this has a
 * >50% chance of being reused elsewhere in the app. However, adding it as a
 * form component has too much overhead. It'll be kept outside for now.
 *
 * The props for this component take cues from InputField.tsx
 *
 * The implementation uses HTMLDivElement with `contentEditable="true"` in
 * order for the width to expand with the content inside.
 *
 * If you are expecting the usual HtmlInputElement, this may have some quirky
 * behaviours that'll need your help to improve.
 *
 * TODO(leedongwei): Add to storybook
 * TODO(leedongwei): Add some tests
 */
class InputInline extends React.Component<Props, State> {
  state = {
    isFocused: false,
    isHovering: false,
  };

  private refInput = React.createRef<HTMLDivElement>();

  onBlur = (event: React.FocusEvent) => {
    this.setState({isFocused: false});
    callIfFunction(this.props.onBlur, event);
  };

  onFocus = (event: React.FocusEvent) => {
    this.setState({isFocused: true});
    callIfFunction(this.props.onFocus, event);
  };

  /**
   * HACK(leedongwei): ContentEditable is not a Form element, and as such it
   * does not emit onChange events. This method using onInput and capture the
   * inner value to be passed along to an onChange function.
   */
  onInputToOnChange = (event: React.FormEvent) => {
    // @types/react left event.target as an empty interface
    (event.target as any).value = (event.target as any).innerHTML;
    (event.currentTarget as any).value = (event.currentTarget as any).innerHTML;
    callIfFunction(this.props.onChange, event);
  };

  onKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && this.refInput.current) {
      this.refInput.current.blur();
    }
  };

  onMouseEnter = () => {
    this.setState({isHovering: true});
  };
  onMouseMove = () => {
    this.setState({isHovering: true});
  };
  onMouseLeave = () => {
    this.setState({isHovering: false});
  };

  onClickIcon = (event: React.MouseEvent) => {
    if (this.refInput.current) {
      this.refInput.current.focus();
    }

    callIfFunction(this.props.onClick, event);
  };

  render() {
    const {value, placeholder} = this.props;
    return (
      <Wrapper
        style={this.props.style}
        onMouseEnter={this.onMouseEnter}
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
      >
        <Input
          {...this.props} // Pass DOMAttributes props first, extend/overwrite below
          innerRef={this.refInput}
          contentEditable
          dangerouslySetInnerHTML={{__html: value || placeholder || ''}}
          isHovering={this.state.isHovering}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          onInput={this.onInputToOnChange} // ContentEditable does not emit onChange events
          onChange={this.onInputToOnChange} // Overwrite onChange, just to be 100% sure
          onKeyUp={this.onKeyUp}
        />
        {!this.state.isFocused && (
          <div onClick={this.onClickIcon}>
            <InputButton src="icon-edit-pencil" size="1em" />
          </div>
        )}
      </Wrapper>
    );
  }
}

const Wrapper = styled('div')`
  display: inline-flex;
  align-items: center;
`;
const Input = styled('div')<{isHovering: boolean}>`
  min-width: 100px;

  padding: ${space(0.25)} ${space(1)};
  margin: 0;
  border: 1px solid ${p => (p.isHovering ? p.theme.borderDark : 'transparent')};

  line-height: inherit;
  border-radius: ${space(0.5)};
  background: transparent;

  &:focus,
  &:active {
    border: 1px solid ${p => p.theme.offWhite2};
    background-color: ${p => p.theme.offWhite2};
  }
`;
const InputButton = styled(InlineSvg)`
  color: ${p => p.theme.gray2};
  margin-left: ${space(0.5)};

  &:hover {
    cursor: pointer;
  }
`;

export default InputInline;
