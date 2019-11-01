import React from 'react';
import {Location} from 'history';
import styled from 'react-emotion';
import {browserHistory} from 'react-router';

import {Client} from 'app/api';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import {extractAnalyticsQueryFields} from 'app/utils';
import {trackAnalyticsEvent} from 'app/utils/analytics';
import withApi from 'app/utils/withApi';
import withDiscoverSavedQueries from 'app/utils/withDiscoverSavedQueries';

import {
  deleteSavedQuery,
  updateSavedQuery,
} from 'app/actionCreators/discoverSavedQueries';
import {addSuccessMessage} from 'app/actionCreators/indicator';
import {SavedQuery} from 'app/stores/discoverSavedQueriesStore';

import Button from 'app/components/button';
import DropdownButton from 'app/components/dropdownButton';
import DropdownControl from 'app/components/dropdownControl';
import InlineSvg from 'app/components/inlineSvg';
import Input from 'app/components/forms/input';
import space from 'app/styles/space';

import EventView from './eventView';
import EventsSaveQueryButton from './saveQueryButton';

type Props = {
  api: Client;
  eventView: EventView;
  location: Location;
  organization: Organization;
  savedQueries: SavedQuery[];
};

type State = {
  isNewQuery: boolean;
  isEditingQuery: boolean;
};

class SavedQueryButtonGroup extends React.Component<Props> {
  static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
    const {eventView, savedQueries} = nextProps;
    console.log(prevState, savedQueries);

    const savedQuery = savedQueries.find(q => q.id === eventView.id);

    return {
      isNewQuery: !!savedQuery,
      // isEditingQuery: !!SavedQueryButtonGroup.getExistingSavedQuery() && hasValidId,
    };
  }

  static getSavedQueryFromStore(
    eventView: EventView,
    savedQueries: SavedQuery[]
  ): SavedQuery | undefined {
    return savedQueries.find(q => q.id === eventView.id);
  }

  static getExistingSavedQuery = (
    eventView: EventView,
    savedQueries: SavedQuery[]
  ): EventView | undefined => {
    const index = savedQueries.findIndex(needle => {
      return needle.id === eventView.id;
    });

    if (index < 0) {
      return undefined;
    }

    return EventView.fromSavedQuery(savedQueries[index]);
  };

  state = {
    isNewQuery: false,
    isEditingQuery: false,
  };

  isEditingExistingQuery = (): boolean => {
    // const {eventView} = this.props;
    // const isValidId = typeof eventView.id === 'string';

    // return !!this.getExistingSavedQuery() && isValidId;
    return true;
  };

  deleteQuery = (event: React.MouseEvent<Element>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isEditingExistingQuery()) {
      return;
    }

    const {organization, api, eventView} = this.props;

    trackAnalyticsEvent({
      eventKey: 'discover_v2.delete_query_request',
      eventName: 'Discoverv2: Request to delete a saved query',
      organization_id: organization.id,
      ...extractAnalyticsQueryFields(eventView.toNewQuery()),
    });

    deleteSavedQuery(api, organization.slug, eventView.id!)
      .then(() => {
        addSuccessMessage(t('Query deleted'));

        // redirect to the primary discover2 page

        browserHistory.push({
          pathname: location.pathname,
          query: {},
        });

        trackAnalyticsEvent({
          eventKey: 'discover_v2.delete_query_success',
          eventName: 'Discoverv2: Successfully deleted a saved query',
          organization_id: organization.id,
          ...extractAnalyticsQueryFields(eventView.toNewQuery()),
        });
      })
      .catch((err: Error) => {
        trackAnalyticsEvent({
          eventKey: 'discover_v2.delete_query_failed',
          eventName: 'Discoverv2: Failed to delete a saved query',
          organization_id: organization.id,
          ...extractAnalyticsQueryFields(eventView.toNewQuery()),
          error: (err && err.message) || 'Failed to delete query',
        });
      });
  };

  handleSaveQuery = (event: React.MouseEvent<Element>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isEditingExistingQuery()) {
      return;
    }

    const {organization, api, eventView} = this.props;

    const payload = eventView.toNewQuery();

    trackAnalyticsEvent({
      eventKey: 'discover_v2.update_query_request',
      eventName: 'Discoverv2: Request to update a saved query',
      organization_id: organization.id,
      ...extractAnalyticsQueryFields(payload),
    });

    updateSavedQuery(api, organization.slug, payload)
      .then(_saved => {
        addSuccessMessage(t('Query updated'));

        trackAnalyticsEvent({
          eventKey: 'discover_v2.update_query_success',
          eventName: 'Discoverv2: Successfully updated a saved query',
          organization_id: organization.id,
          ...extractAnalyticsQueryFields(payload),
        });
        // NOTE: there is no need to convert _saved into an EventView and push it
        //       to the browser history, since this.props.eventView already
        //       derives from location.
      })
      .catch((err: Error) => {
        trackAnalyticsEvent({
          eventKey: 'discover_v2.update_query_failed',
          eventName: 'Discoverv2: Failed to update a saved query',
          organization_id: organization.id,
          ...extractAnalyticsQueryFields(payload),
          error: (err && err.message) || 'Failed to update a query',
        });
      });
  };

  isQueryModified = (): boolean => {
    // const previousSavedQuery = this.getExistingSavedQuery();

    // if (!previousSavedQuery) {
    //   return false;
    // }

    // const {eventView} = this.props;

    // return !eventView.isEqualTo(previousSavedQuery);
    return true;
  };

  renderSaveButton = () => {
    if (!this.isEditingExistingQuery()) {
      return null;
    }

    return (
      <Button disabled={!this.isQueryModified()} onClick={this.handleSaveQuery}>
        {t('Update query')}
      </Button>
    );
  };

  renderButtonDelete = () => {
    if (!this.isEditingExistingQuery()) {
      return null;
    }

    return <Button icon="icon-trash" onClick={this.deleteQuery} />;
  };

  renderButtonSaveAs() {
    // const queryName = this.props;
    const {isNewQuery} = this.state;

    // console.log('renderButtonSaveAs', this.props.queryName);

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
        <ButtonSaveDropDown
        // onClick={this.stopEventPropagation}
        >
          <ButtonSaveInput
            type="text"
            placeholder={t('Display name')}
            // value={this.state.queryName}
            // onBlur={this.handleInputBlur}
            // onChange={this.handleInputChange}
          />
          <Button
            // onClick={this.handleSave}
            priority="primary"
            style={{width: '100%'}}
          >
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
        <ButtonUpdateIcon onClick={undefined} />
        {t('Update query')}
      </Button>
    );
  }

  render() {
    const {location, organization, eventView, savedQueries} = this.props;

    return (
      <ButtonGroup>
        <EventsSaveQueryButton
          location={location}
          organization={organization}
          eventView={eventView}
          savedQueries={savedQueries}
          isEditingExistingQuery={this.isEditingExistingQuery()}
        />
        {this.renderButtonDelete()}
        {this.renderButtonSaveAs()}
        {this.renderButtonUpdate()}
        {this.renderButtonSaved()}
      </ButtonGroup>
    );
  }
}

const ButtonGroup = styled('div')`
  display: flex;
  align-items: center;

  > * + * {
    margin-left: ${space(1)};
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

export default withApi(withDiscoverSavedQueries(SavedQueryButtonGroup));
