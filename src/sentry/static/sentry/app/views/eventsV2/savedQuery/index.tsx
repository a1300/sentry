import React from 'react';
import styled from 'react-emotion';
import {browserHistory} from 'react-router';
import {Location} from 'history';

import {Client} from 'app/api';
import {Organization} from 'app/types';
import {t} from 'app/locale';
import withApi from 'app/utils/withApi';

import {
  createSavedQuery,
  updateSavedQuery,
} from 'app/actionCreators/discoverSavedQueries';
import {addSuccessMessage} from 'app/actionCreators/indicator';
import DiscoverSavedQueriesStore, {
  SavedQuery,
} from 'app/stores/discoverSavedQueriesStore';

import DropdownButton from 'app/components/dropdownButton';
import DropdownControl from 'app/components/dropdownControl';
import Button from 'app/components/button';
import Input from 'app/components/forms/input';
import InlineSvg from 'app/components/inlineSvg';
import space from 'app/styles/space';
import EventView from '../eventView';

type Props = {
  api: Client;
  organization: Organization;
  eventView: EventView;
  location: Location;
  //   isEditing: boolean;

  queryName: string;
  onChangeQueryName: (queryName: string) => void;
  onStageQueryName: (queryName: string) => void;
};

type State = {
  isNewQuery: boolean;
  hasUnsavedChanges: boolean;

  queryName: string;
  savedQueries: SavedQuery[];
};

/**
 * This class takes in SaveQuery state from 2 sources: the discoverSavedQueries
 * Reflux store and the EventView class.
 */
class SaveQuery extends React.Component<Props, State> {
  static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
    // Would be good to check the store here
    const store = DiscoverSavedQueriesStore.get();
    const {eventView} = nextProps;

    console.log(prevState);

    return {
      ...SaveQuery.compareEventViewAndStore(eventView, store.savedQueries),
      queryName: eventView.name,
      savedQueries: store.savedQueries,
    };
  }

  static compareEventViewAndStore(
    eventView: EventView,
    savedQueries: SavedQuery[]
  ): Pick<State, 'isNewQuery' & 'hasUnsavedChanges'> {
    const queryId = eventView.id;
    if (!queryId) {
      return {
        isNewQuery: true,
        hasUnsavedChanges: true,
      };
    }

    const query = savedQueries.find(q => q.id === queryId);
    // queryId in EventView cannot be found in Store.
    // Perhaps throwing an error might be more appropriate
    if (!query) {
      return {
        isNewQuery: true,
        hasUnsavedChanges: true,
      };
    }

    if (query.name !== eventView.name) {
      return {
        isNewQuery: false,
        hasUnsavedChanges: true,
      };
    }

    return {
      isNewQuery: false,
      hasUnsavedChanges: false,
    };
  }

  state = {
    isNewQuery: false,
    hasUnsavedChanges: true,
    queryName: 'Untitled query',
    savedQueries: [],
  };

  componentDidMount() {
    DiscoverSavedQueriesStore.listen(store => {
      if (store.hasError || store.isLoading) {
        return;
      }

      if (store.savedQueries) {
        this.setState({
          savedQueries: store.savedQueries,
        });
      }
    });
  }

  /*
  componentDidUpdate(prevProps: Props) {
    // Going from one query to another whilst not leaving edit mode
    if (
      (this.props.isEditing === true &&
        this.props.eventView.id !== prevProps.eventView.id) ||
      this.props.isEditing !== prevProps.isEditing
    ) {
      const queryName =
        this.props.isEditing === true ? this.props.eventView.name || '' : '';

      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({queryName});
    }
  }
  */

  stopEventPropagation = (event: React.MouseEvent) => {
    // Stop propagation for the input and container so
    // people can interact with the inputs in the dropdown.
    const capturedElements = ['LI', 'INPUT'];
    if (
      event.target instanceof Element &&
      capturedElements.includes(event.target.nodeName)
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.setState({queryName: value});
  };

  handleInputBlur = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.props.onStageQueryName(value);
  };

  handleSave = () => {
    const {api, eventView, organization, location} = this.props;
    const {isNewQuery, hasUnsavedChanges} = this.state;

    if (!isNewQuery && !hasUnsavedChanges) {
      return;
    }

    const payload = eventView.toNewQuery();
    if (this.state.queryName) {
      payload.name = this.state.queryName;
    }

    const promise = isNewQuery
      ? createSavedQuery(api, organization.slug, payload)
      : updateSavedQuery(api, organization.slug, payload);

    promise.then(saved => {
      addSuccessMessage(t('Query saved'));

      const view = EventView.fromSavedQuery(saved);
      browserHistory.push({
        pathname: location.pathname,
        query: view.generateQueryStringObject(),
      });
    });
  };

  renderButtonSaveAs() {
    // const queryName = this.props;
    const {isNewQuery} = this.state;

    console.log('renderButtonSaveAs', this.props.queryName);

    return (
      <DropdownControl
        alignRight
        menuWidth="220px"
        button={({isOpen, getActorProps}) => (
          <ButtonSave
            {...getActorProps({isStyled: true})}
            isOpen={isOpen}
            showChevron={false}
          >
            <ButtonSaveIcon
              isNewQuery={isNewQuery}
              src="icon-star-small-filled"
              size="14"
            />
            {t('Save as...')}
          </ButtonSave>
        )}
      >
        <ButtonSaveDropDown onClick={this.stopEventPropagation}>
          <ButtonSaveInput
            type="text"
            placeholder={t('Display name')}
            value={this.state.queryName}
            onBlur={this.handleInputBlur}
            onChange={this.handleInputChange}
          />
          <Button onClick={this.handleSave} priority="primary" style={{width: '100%'}}>
            {t('Save')}
          </Button>
        </ButtonSaveDropDown>
      </DropdownControl>
    );
  }

  renderButtonSaved() {
    const {isNewQuery} = this.state;

    return (
      <Button onClick={undefined}>
        <ButtonSaveIcon isNewQuery={isNewQuery} src="icon-star-small-filled" size="14" />
        {t('Saved query')}
      </Button>
    );
  }

  renderButtonUpdate() {
    return (
      <Button>
        <ButtonUpdateIcon onClick={this.handleSave} />
        {t('Update query')}
      </Button>
    );
  }

  render() {
    if (this.state.isNewQuery) {
      return <Wrapper>{this.renderButtonSaveAs()}</Wrapper>;
    }

    if (this.state.hasUnsavedChanges) {
      return (
        <Wrapper>
          {this.renderButtonSaveAs()}
          {this.renderButtonUpdate()}
        </Wrapper>
      );
    }

    return <Wrapper>{this.renderButtonSaved()}</Wrapper>;
  }
}

const Wrapper = styled('div')`
  display: flex;

  > * {
    margin: ${space(1)};

    &:last-child {
      margin-right: 0;
    }
  }
`;

const ButtonSave = styled(DropdownButton)`
  z-index: ${p => p.theme.zIndex.dropdownAutocomplete.actor};
  white-space: nowrap;
`;
const ButtonSaveIcon = styled(InlineSvg)<{isNewQuery?: boolean}>`
  margin-top: -3px; /* Align SVG vertically to text */
  margin-right: ${space(0.75)};

  color: ${p => (p.isNewQuery ? p.theme.yellow : '#c4c4c4')};
`;
const ButtonSaveDropDown = styled('li')`
  padding: ${space(1)};
`;
const ButtonSaveInput = styled(Input)`
  width: 100%;
  margin-bottom: ${space(1)};
`;

const ButtonUpdateIcon = styled('div')`
  display: inline-block;
  width: 10px;
  height: 10px;

  margin-right: ${space(0.75)};
  border-radius: 5px;
  background-color: ${p => p.theme.yellow};
`;

export default withApi(SaveQuery);
