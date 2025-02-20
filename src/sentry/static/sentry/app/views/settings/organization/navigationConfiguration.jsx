import {t} from 'app/locale';

const pathPrefix = '/settings/:orgId';

const organizationNavigation = [
  {
    name: t('Organization'),
    items: [
      {
        path: `${pathPrefix}/`,
        title: t('General Settings'),
        index: true,
        description: t('Configure general settings for an organization'),
        id: 'general',
      },
      {
        path: `${pathPrefix}/projects/`,
        title: t('Projects'),
        description: t("View and manage an organization's projects"),
        id: 'projects',
      },
      {
        path: `${pathPrefix}/teams/`,
        title: t('Teams'),
        description: t("Manage an organization's teams"),
        id: 'teams',
      },
      {
        path: `${pathPrefix}/members/`,
        title: t('Members'),
        show: ({access}) => access.has('member:read'),
        description: t('Manage user membership for an organization'),
        id: 'members',
      },
      {
        path: `${pathPrefix}/incident-rules/`,
        title: t('Incident Rules'),
        show: ({features}) => features.has('incidents'),
        description: t('Manage Incident Rules'),
        id: 'incident-rules',
      },
      {
        path: `${pathPrefix}/auth/`,
        title: t('Auth'),
        description: t('Configure single sign-on'),
        id: 'sso',
      },
      {
        path: `${pathPrefix}/api-keys/`,
        title: t('API Keys'),
        show: ({access, features}) => features.has('api-keys') && access.has('org:admin'),
        id: 'api-keys',
      },
      {
        path: `${pathPrefix}/audit-log/`,
        title: t('Audit Log'),
        show: ({access}) => access.has('org:write'),
        description: t('View the audit log for an organization'),
        id: 'audit-log',
      },
      {
        path: `${pathPrefix}/rate-limits/`,
        title: t('Rate Limits'),
        show: ({access, features}) =>
          features.has('legacy-rate-limits') && access.has('org:write'),
        description: t('Configure rate limits for all projects in the organization'),
        id: 'rate-limits',
      },
      {
        path: `${pathPrefix}/repos/`,
        title: t('Repositories'),
        description: t('Manage repositories connected to the organization'),
        id: 'repos',
      },
      {
        path: `${pathPrefix}/integrations/`,
        title: t('Integrations'),
        description: t(
          'Manage organization-level integrations, including: Slack, Github, Bitbucket, Jira, and Azure DevOps'
        ),
        id: 'integrations',
      },
      {
        path: `${pathPrefix}/developer-settings/`,
        title: t('Developer Settings'),
        description: t('Manage developer applications'),
        id: 'developer-settings',
      },
    ],
  },
];

export default organizationNavigation;
