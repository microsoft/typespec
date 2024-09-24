# coding=utf-8
# --------------------------------------------------------------------------
# Copyright (c) Unbranded Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# Code generated by Unbranded (R) Python Code Generator.
# Changes may cause incorrect behavior and will be lost if the code is regenerated.
# --------------------------------------------------------------------------

from typing import Any, Union

from corehttp.runtime import policies

from .. import models as _models
from .._version import VERSION


class ServiceClientConfiguration:  # pylint: disable=too-many-instance-attributes
    """Configuration for ServiceClient.

    Note that all parameters used to create this instance are saved as instance
    attributes.

    :param endpoint: Need to be set as 'http://localhost:3000' in client. Required.
    :type endpoint: str
    :param client: Need to be set as 'default', 'multi-client', 'renamed-operation',
     'two-operation-group' in client. Known values are: "default", "multi-client",
     "renamed-operation", and "two-operation-group". Required.
    :type client: str or ~client.structure.service.models.ClientType
    """

    def __init__(self, endpoint: str, client: Union[str, _models.ClientType], **kwargs: Any) -> None:
        if endpoint is None:
            raise ValueError("Parameter 'endpoint' must not be None.")
        if client is None:
            raise ValueError("Parameter 'client' must not be None.")

        self.endpoint = endpoint
        self.client = client
        kwargs.setdefault("sdk_moniker", "client-structure-service/{}".format(VERSION))
        self.polling_interval = kwargs.get("polling_interval", 30)
        self._configure(**kwargs)

    def _configure(self, **kwargs: Any) -> None:
        self.user_agent_policy = kwargs.get("user_agent_policy") or policies.UserAgentPolicy(**kwargs)
        self.headers_policy = kwargs.get("headers_policy") or policies.HeadersPolicy(**kwargs)
        self.proxy_policy = kwargs.get("proxy_policy") or policies.ProxyPolicy(**kwargs)
        self.logging_policy = kwargs.get("logging_policy") or policies.NetworkTraceLoggingPolicy(**kwargs)
        self.retry_policy = kwargs.get("retry_policy") or policies.AsyncRetryPolicy(**kwargs)
        self.authentication_policy = kwargs.get("authentication_policy")
