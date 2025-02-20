from __future__ import absolute_import, print_function, unicode_literals

from sentry.models import Activity, OrganizationMember, OrganizationMemberTeam
from sentry.incidents.models import IncidentActivityType

import pytest
from django.utils.functional import cached_property
from sentry.testutils.factories import Factories


# XXX(dcramer): this is a compatibility layer to transition to pytest-based fixtures
# all of the memoized fixtures are copypasta due to our inability to use pytest fixtures
# on a per-class method basis
class Fixtures(object):
    @cached_property
    def session(self):
        return Factories.create_session()

    @cached_property
    def projectkey(self):
        return self.create_project_key(project=self.project)

    @cached_property
    def user(self):
        return self.create_user("admin@localhost", is_superuser=True)

    @cached_property
    def organization(self):
        # XXX(dcramer): ensure that your org slug doesnt match your team slug
        # and the same for your project slug
        return self.create_organization(name="baz", slug="baz", owner=self.user)

    @cached_property
    def team(self):
        team = self.create_team(organization=self.organization, name="foo", slug="foo")
        # XXX: handle legacy team fixture
        queryset = OrganizationMember.objects.filter(organization=self.organization)
        for om in queryset:
            OrganizationMemberTeam.objects.create(team=team, organizationmember=om, is_active=True)
        return team

    @cached_property
    def project(self):
        return self.create_project(
            name="Bar", slug="bar", teams=[self.team], fire_project_created=True
        )

    @cached_property
    def environment(self):
        return self.create_environment(name="development", project=self.project)

    @cached_property
    def group(self):
        return self.create_group(message="\u3053\u3093\u306b\u3061\u306f")

    @cached_property
    def event(self):
        return self.create_event(event_id="a" * 32, message="\u3053\u3093\u306b\u3061\u306f")

    @cached_property
    def activity(self):
        return Activity.objects.create(
            group=self.group, project=self.project, type=Activity.NOTE, user=self.user, data={}
        )

    def create_organization(self, *args, **kwargs):
        return Factories.create_organization(*args, **kwargs)

    def create_member(self, *args, **kwargs):
        return Factories.create_member(*args, **kwargs)

    def create_team_membership(self, *args, **kwargs):
        return Factories.create_team_membership(*args, **kwargs)

    def create_team(self, organization=None, **kwargs):
        if organization is None:
            organization = self.organization

        return Factories.create_team(organization=organization, **kwargs)

    def create_environment(self, project=None, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_environment(project=project, **kwargs)

    def create_project(self, **kwargs):
        kwargs.setdefault("teams", [self.team])
        return Factories.create_project(**kwargs)

    def create_project_bookmark(self, project=None, *args, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_project_bookmark(project=project, *args, **kwargs)

    def create_project_key(self, project=None, *args, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_project_key(project=project, *args, **kwargs)

    def create_release(self, project=None, user=None, *args, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_release(project=project, user=user, *args, **kwargs)

    def create_artifact_bundle(self, org=None, release=None, *args, **kwargs):
        if org is None:
            org = self.organization.slug
        if release is None:
            release = self.release.version
        return Factories.create_artifact_bundle(org, release, *args, **kwargs)

    def create_repo(self, project=None, *args, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_repo(project=project, *args, **kwargs)

    def create_commit(self, *args, **kwargs):
        return Factories.create_commit(*args, **kwargs)

    def create_commit_author(self, *args, **kwargs):
        return Factories.create_commit_author(*args, **kwargs)

    def create_commit_file_change(self, *args, **kwargs):
        return Factories.create_commit_file_change(*args, **kwargs)

    def create_user(self, *args, **kwargs):
        return Factories.create_user(*args, **kwargs)

    def create_useremail(self, *args, **kwargs):
        return Factories.create_useremail(*args, **kwargs)

    def create_event(self, event_id=None, group=None, *args, **kwargs):
        if group is None:
            group = self.group
        return Factories.create_event(event_id=event_id, group=group, *args, **kwargs)

    def create_issueless_event(self, event_id=None, *args, **kwargs):
        return Factories.create_event(event_id=event_id, group=None, *args, **kwargs)

    def store_event(self, *args, **kwargs):
        return Factories.store_event(*args, **kwargs)

    def create_full_event(self, group=None, *args, **kwargs):
        if group is None:
            group = self.group
        return Factories.create_full_event(group=group, *args, **kwargs)

    def create_group(self, project=None, *args, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_group(project=project, *args, **kwargs)

    def create_file(self, **kwargs):
        return Factories.create_file(**kwargs)

    def create_file_from_path(self, *args, **kwargs):
        return Factories.create_file_from_path(*args, **kwargs)

    def create_event_attachment(self, event=None, *args, **kwargs):
        if event is None:
            event = self.event
        return Factories.create_event_attachment(event=event, *args, **kwargs)

    def create_dif_file(self, project=None, *args, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_dif_file(project=project, *args, **kwargs)

    def create_dif_from_path(self, project=None, *args, **kwargs):
        if project is None:
            project = self.project
        return Factories.create_dif_from_path(project=project, *args, **kwargs)

    def add_user_permission(self, *args, **kwargs):
        return Factories.add_user_permission(*args, **kwargs)

    def create_sentry_app(self, *args, **kwargs):
        return Factories.create_sentry_app(*args, **kwargs)

    def create_internal_integration(self, *args, **kwargs):
        return Factories.create_internal_integration(*args, **kwargs)

    def create_internal_integration_token(self, *args, **kwargs):
        return Factories.create_internal_integration_token(*args, **kwargs)

    def create_sentry_app_installation(self, *args, **kwargs):
        return Factories.create_sentry_app_installation(*args, **kwargs)

    def create_issue_link_schema(self, *args, **kwargs):
        return Factories.create_issue_link_schema(*args, **kwargs)

    def create_alert_rule_action_schema(self, *args, **kwargs):
        return Factories.create_alert_rule_action_schema(*args, **kwargs)

    def create_sentry_app_feature(self, *args, **kwargs):
        return Factories.create_sentry_app_feature(*args, **kwargs)

    def create_sentry_app_webhook_error(self, *args, **kwargs):
        return Factories.create_sentry_app_webhook_error(*args, **kwargs)

    def create_service_hook(self, *args, **kwargs):
        return Factories.create_service_hook(*args, **kwargs)

    def create_userreport(self, *args, **kwargs):
        return Factories.create_userreport(*args, **kwargs)

    def create_platform_external_issue(self, *args, **kwargs):
        return Factories.create_platform_external_issue(*args, **kwargs)

    def create_incident(self, organization=None, projects=None, *args, **kwargs):
        if not organization:
            organization = self.organization
        if projects is None:
            projects = [self.project]

        return Factories.create_incident(
            organization=organization, projects=projects, *args, **kwargs
        )

    def create_incident_activity(self, incident, *args, **kwargs):
        return Factories.create_incident_activity(incident=incident, *args, **kwargs)

    def create_incident_comment(self, incident, *args, **kwargs):
        return self.create_incident_activity(
            incident, type=IncidentActivityType.COMMENT.value, *args, **kwargs
        )

    def create_alert_rule(self, organization=None, projects=None, *args, **kwargs):
        if not organization:
            organization = self.organization
        if projects is None:
            projects = [self.project]
        return Factories.create_alert_rule(organization, projects, *args, **kwargs)

    @pytest.fixture(autouse=True)
    def _init_insta_snapshot(self, insta_snapshot):
        self.insta_snapshot = insta_snapshot
