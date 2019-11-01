import React from 'react';
import DocumentTitle from 'react-document-title';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import * as ReactRouter from 'react-router';
import {Params} from 'react-router/lib/Router';
import {Location} from 'history';

import {t} from 'app/locale';
import {trackAnalyticsEvent} from 'app/utils/analytics';
import SentryTypes from 'app/sentryTypes';
import {Organization} from 'app/types';
import withOrganization from 'app/utils/withOrganization';

import GlobalSelectionHeader from 'app/components/organizations/globalSelectionHeader';
import PageHeading from 'app/components/pageHeading';
import BetaTag from 'app/components/betaTag';
import Feature from 'app/components/acl/feature';
import Link from 'app/components/links/link';
import NoProjectMessage from 'app/components/noProjectMessage';
import CustomInput from 'app/components/inputInline';

import {PageContent, PageHeader} from 'app/styles/organization';
import space from 'app/styles/space';

import Events from './events';
import EventDetails from './eventDetails';
import SavedQueryButtonGroup from './savedQueryButtonGroup';
import EventView from './eventView';
// import SavedQuery from './savedQuery';
// import InputInline from './savedQuery/inputInline';
// import EventsSaveQueryButton from './saveQueryButton';
import {getFirstQueryString} from './utils';
import {ALL_VIEWS, TRANSACTION_VIEWS} from './data';

type Props = {
  organization: Organization;
  location: Location;
  router: ReactRouter.InjectedRouter;
  params: Params;
};
type State = {
  queryName: string;
};

class EventsV2 extends React.Component<Props, State> {
  static propTypes: any = {
    organization: SentryTypes.Organization.isRequired,
    location: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
  };

  static getDerivedStateFromProps(props: Props): State {
    const {location} = props;
    const queryName = getFirstQueryString(location.query, 'name') || t('Untitied query');

    return {queryName};
  }

  renderQueryList() {
    const {location, organization} = this.props;
    let views = ALL_VIEWS;
    if (organization.features.includes('transaction-events')) {
      views = [...ALL_VIEWS, ...TRANSACTION_VIEWS];
    }

    const list = views.map((eventViewv1, index) => {
      const eventView = EventView.fromEventViewv1(eventViewv1);
      const to = {
        pathname: location.pathname,
        query: {
          ...location.query,
          ...eventView.generateQueryStringObject(),
        },
      };

      return (
        <LinkContainer key={index}>
          <Link
            to={to}
            onClick={() => {
              trackAnalyticsEvent({
                eventKey: 'discover_v2.prebuilt_query_click',
                eventName: 'Discoverv2: Click a pre-built query',
                organization_id: this.props.organization.id,
                query_name: eventView.name,
              });
            }}
          >
            {eventView.name}
          </Link>
        </LinkContainer>
      );
    });

    return <LinkList>{list}</LinkList>;
  }

  getEventViewName = (): Array<string> => {
    const {location} = this.props;
    const name = getFirstQueryString(location.query, 'name');

    return typeof name === 'string' && String(name).trim().length > 0
      ? [t('Discover'), String(name).trim()]
      : [t('Discover')];
  };

  // onChangeQueryName = (queryName: string) => {
  //   console.log('onChangeQueryName', queryName);
  //   this.setState({queryName});
  // };

  // onStageQueryName = (queryName: string) => {
  //   console.log('onStageQueryName', queryName);
  //   const {location} = this.props;
  //   const nextEventView = EventView.fromLocation(location);
  //   nextEventView.name = queryName;

  //   pushEventViewToLocation({location, nextEventView});
  // };

  render() {
    const {organization, location, router} = this.props;
    const eventSlug = getFirstQueryString(location.query, 'eventSlug');
    const eventView = EventView.fromLocation(location);

    const hasQuery = location.query.field || location.query.eventSlug;

    const documentTitle = this.getEventViewName()
      .reverse()
      .join(' - ');
    // const pageTitle = this.getEventViewName().join(' \u2014 ');

    return (
      <Feature features={['events-v2']} organization={organization} renderDisabled>
        <DocumentTitle title={`${documentTitle} - ${organization.slug} - Sentry`}>
          <React.Fragment>
            <GlobalSelectionHeader organization={organization} />
            <PageContent>
              <NoProjectMessage organization={organization}>
                <PageHeader>
                  <PageHeading>
                    {/* {pageTitle} <BetaTag /> */}
                    Discover <BetaTag /> {' \u2014 '}
                    <br />
                    {/* <InputInline
                      eventView={eventView}
                      value={this.state.queryName}
                      onChangeValue={this.onStageQueryName}
                    /> */}
                    <CustomInput name="query-name" value={this.state.queryName} />
                  </PageHeading>
                  {hasQuery && (
                    <React.Fragment>
                      <SavedQueryButtonGroup
                        location={location}
                        organization={organization}
                        eventView={eventView}
                      />
                      {/* <SavedQuery
                        location={location}
                        organization={organization}
                        eventView={eventView}
                        queryName={this.state.queryName}
                        onChangeQueryName={this.onChangeQueryName}
                        onStageQueryName={this.onStageQueryName}
                      /> */}
                    </React.Fragment>
                  )}
                </PageHeader>
                {!hasQuery && this.renderQueryList()}
                {hasQuery && (
                  <Events
                    organization={organization}
                    location={location}
                    router={router}
                    eventView={eventView}
                  />
                )}
                {hasQuery && eventSlug && (
                  <EventDetails
                    organization={organization}
                    params={this.props.params}
                    eventSlug={eventSlug}
                    eventView={eventView}
                    location={location}
                  />
                )}
              </NoProjectMessage>
            </PageContent>
          </React.Fragment>
        </DocumentTitle>
      </Feature>
    );
  }
}

const LinkList = styled('ul')`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const LinkContainer = styled('li')`
  background: ${p => p.theme.white};
  line-height: 1.4;
  border: 1px solid ${p => p.theme.borderLight};
  border-radius: ${p => p.theme.borderRadius};
  margin-bottom: ${space(1)};
  padding: ${space(1)};
`;

export default withOrganization(EventsV2);
export {EventsV2};
