# coding=utf-8

from typing import Any

from corehttp.runtime import policies

from ._version import VERSION


class AddedClientConfiguration:  # pylint: disable=docstring-keyword-should-match-keyword-only
    """Configuration for AddedClient.

    Note that all parameters used to create this instance are saved as instance
    attributes.

    :param endpoint: Need to be set as '`http://localhost:3000 <http://localhost:3000>`_' in
     client. Required.
    :type endpoint: str
    :keyword version: Need to be set as 'v1' or 'v2' in client. Known values are "v2" and None.
     Default value is None. If not set, the operation's default API version will be used. Note that
     overriding this default value may result in unsupported behavior.
    :paramtype version: str or ~generation.subdir2.models.Versions
    """

    def __init__(self, endpoint: str, **kwargs: Any) -> None:
        version: str = kwargs.pop("version", "v2")

        if endpoint is None:
            raise ValueError("Parameter 'endpoint' must not be None.")

        self.endpoint = endpoint
        self.version = version
        kwargs.setdefault("sdk_moniker", "generation-subdir2/{}".format(VERSION))
        self.polling_interval = kwargs.get("polling_interval", 30)
        self._configure(**kwargs)

    def _configure(self, **kwargs: Any) -> None:
        self.user_agent_policy = kwargs.get("user_agent_policy") or policies.UserAgentPolicy(**kwargs)
        self.headers_policy = kwargs.get("headers_policy") or policies.HeadersPolicy(**kwargs)
        self.proxy_policy = kwargs.get("proxy_policy") or policies.ProxyPolicy(**kwargs)
        self.logging_policy = kwargs.get("logging_policy") or policies.NetworkTraceLoggingPolicy(**kwargs)
        self.retry_policy = kwargs.get("retry_policy") or policies.RetryPolicy(**kwargs)
        self.authentication_policy = kwargs.get("authentication_policy")
