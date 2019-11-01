import React from 'react';
// import styled from 'react-emotion';

// import InlineSvg from 'app/components/inlineSvg';

// import space from 'app/styles/space';

import EventView from '../eventView';

type Props = {
  eventView: EventView;

  value: string;
  onChangeValue: (value: string) => void;
};
type State = {
  queryId: string | undefined;
  queryName: string;
};

/**
 * InputInline is a cool pattern but it is not used elsewhere at this moment.
 * Adding it as a form component has too much overhead and putting it in the
 * app/component folder doesn't seem quite right.
 * As such, it is coupled to Discover2 Saved Query for now.
 */
class InputInline extends React.Component<Props, State> {
  static defaultProps = {
    value: 'Untitled query',
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
    console.log('getDerivedStateFromProps', nextProps.value, prevState.queryName);

    if (nextProps.eventView.id !== prevState.queryId) {
      return {
        queryId: nextProps.eventView.id,
        queryName: nextProps.value,
      };
    }

    return {};
  }

  state = {
    queryId: undefined,
    queryName: this.props.value,
  };

  private refInput;

  handleFocusOnInput() {
    if (this.refInput) {
      this.refInput.focus();
    }
  }

  onBlur = event => {
    const queryName = event.target.value;
    console.log('onBlur', queryName);
    this.props.onChangeValue(queryName);
  };

  onChange = event => {
    const queryName = event.target.value;
    console.log('onChange', queryName);
    this.setState({queryName});
    // this.props.onChangeValue(queryName);
  };

  onClickButton() {
    //
  }

  render() {
    return <div>NIL</div>;
  }
}

// const Input = styled('input')`
//   border: none;
//   padding: 1px ${space(1)};
//   margin: 0 ${space(1)};

//   outline: none;
//   background: transparent;

//   &:focus,
//   &:active {
//     border: none;
//     border-radius: ${space(0.5)};
//     background-color: ${p => p.theme.gray1};
//   }
// `;
// const InputButton = styled(InlineSvg)`
//   color: ${p => p.theme.gray2};

//   &:hover {
//     cursor: pointer;
//   }
// `;

export default InputInline;
