from __future__ import absolute_import

import logging

from sentry.api import client

from sentry.models import ApiKey, User, ProjectOption, Repository
from sentry.plugins.interfaces.releasehook import ReleaseHook
from new_sentry_plugins.base import CorePluginMixin
from sentry.plugins.base.configuration import react_plugin_config
from sentry.plugins.bases import ReleaseTrackingPlugin

logger = logging.getLogger("sentry.plugins.heroku")


class HerokuReleaseHook(ReleaseHook):
    def handle(self, request):
        email = request.POST["user"]
        try:
            user = User.objects.get(
                email__iexact=email, sentry_orgmember_set__organization__project=self.project
            )
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            user = None
        self.finish_release(version=request.POST["head_long"], url=request.POST["url"], owner=user)

    def set_refs(self, release, **values):
        # check if user exists, and then try to get refs based on version
        if values.get("owner", None):
            repo_project_option = ProjectOption.objects.get_value(
                project=self.project, key="heroku:repository"
            )
            deploy_project_option = (
                ProjectOption.objects.get_value(
                    project=self.project, key="heroku:environment", default="production"
                )
                or "production"
            )
            if repo_project_option:
                try:
                    repository = Repository.objects.get(
                        organization_id=self.project.organization_id, name=repo_project_option
                    )
                except Repository.DoesNotExist:
                    logger.info(
                        "repository.missing",
                        extra={
                            "organization_id": self.project.organization_id,
                            "project_id": self.project.id,
                            "repository": repo_project_option,
                        },
                    )
                else:
                    release.set_refs(
                        refs=[{"commit": release.version, "repository": repository.name}],
                        user=values["owner"],
                        fetch=True,
                    )
            # create deploy associated with release via ReleaseDeploysEndpoint
            endpoint = "/organizations/{}/releases/{}/deploys/".format(
                self.project.organization.slug, release.version
            )
            auth = ApiKey(organization=self.project.organization, scope_list=["project:write"])
            client.post(endpoint, data={"environment": deploy_project_option}, auth=auth)
        else:
            logger.info(
                "owner.missing",
                extra={
                    "organization_id": self.project.organization_id,
                    "project_id": self.project.id,
                },
            )


class HerokuPlugin(CorePluginMixin, ReleaseTrackingPlugin):
    author = "Sentry Team"
    author_url = "https://github.com/getsentry"
    resource_links = (
        ("Bug Tracker", "https://github.com/getsentry/sentry-heroku/issues"),
        ("Source", "https://github.com/getsentry/sentry-heroku"),
    )

    title = "Heroku"
    slug = "heroku"
    description = "Integrate Heroku release tracking."

    def configure(self, project, request):
        return react_plugin_config(self, project, request)

    def can_enable_for_projects(self):
        return True

    def can_configure_for_project(self, project):
        return True

    def has_project_conf(self):
        return True

    def get_conf_key(self):
        return "heroku"

    def get_config(self, project, **kwargs):
        repo_list = list(Repository.objects.filter(organization_id=project.organization_id))
        if not ProjectOption.objects.get_value(project=project, key="heroku:repository"):
            choices = [("", "select a repo")]
        else:
            choices = []
        choices.extend([(repo.name, repo.name) for repo in repo_list])
        return [
            {
                "name": "repository",
                "label": "Respository",
                "type": "select",
                "required": True,
                "choices": choices,
                "help": "Select which repository you would like to be associated with this project",
            },
            {
                "name": "environment",
                "label": "Deploy Environment",
                "type": "text",
                "required": False,
                "default": "production",
                "help": "Specify an environment name for your Heroku deploys",
            },
        ]

    def get_release_doc_html(self, hook_url):
        return """
        <p>Add Sentry as a deploy hook to automatically track new releases.</p>
        <pre class="clippy">heroku addons:create deployhooks:http --url={hook_url}</pre>
        """.format(
            hook_url=hook_url
        )

    def get_release_hook(self):
        return HerokuReleaseHook
