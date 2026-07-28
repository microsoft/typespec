# coding=utf-8

from copy import deepcopy
import sys
from typing import Any

from corehttp.rest import HttpRequest, HttpResponse
from corehttp.runtime import PipelineClient, policies

from ._configuration import AddedClientConfiguration
from ._utils.serialization import Deserializer, Serializer
from .operations import InterfaceV2Operations, _AddedClientOperationsMixin

if sys.version_info >= (3, 11):
    from typing import Self
else:
    from typing_extensions import Self  # type: ignore


class AddedClient(
    _AddedClientOperationsMixin
):  # pylint: disable=client-accepts-api-version-keyword,docstring-keyword-should-match-keyword-only
    """Test for the ``@added`` decorator.

    :ivar interface_v2: InterfaceV2Operations operations
    :vartype interface_v2: generation.subdir2.operations.InterfaceV2Operations
    :param endpoint: Need to be set as '`http://localhost:3000 <http://localhost:3000>`_' in
     client. Required.
    :type endpoint: str
    :keyword version: Need to be set as 'v1' or 'v2' in client. Known values are "v2" and None.
     Default value is None. If not set, the operation's default API version will be used. Note that
     overriding this default value may result in unsupported behavior.
    :paramtype version: str or ~generation.subdir2.models.Versions
    """

    def __init__(  # pylint: disable=missing-client-constructor-parameter-credential
        self, endpoint: str, **kwargs: Any
    ) -> None:
        _endpoint = "{endpoint}/versioning/added/api-version:{version}"
        self._config = AddedClientConfiguration(endpoint=endpoint, **kwargs)

        _policies = kwargs.pop("policies", None)
        if _policies is None:
            _policies = [
                self._config.headers_policy,
                self._config.user_agent_policy,
                self._config.proxy_policy,
                policies.ContentDecodePolicy(**kwargs),
                self._config.retry_policy,
                self._config.authentication_policy,
                self._config.logging_policy,
            ]
        self._client: PipelineClient = PipelineClient(endpoint=_endpoint, policies=_policies, **kwargs)

        self._serialize = Serializer()
        self._deserialize = Deserializer()
        self._serialize.client_side_validation = False
        self.interface_v2 = InterfaceV2Operations(self._client, self._config, self._serialize, self._deserialize)

    def send_request(self, request: HttpRequest, *, stream: bool = False, **kwargs: Any) -> HttpResponse:
        """Runs the network request through the client's chained policies.

        >>> from corehttp.rest import HttpRequest
        >>> request = HttpRequest("GET", "https://www.example.org/")
        <HttpRequest [GET], url: 'https://www.example.org/'>
        >>> response = client.send_request(request)
        <HttpResponse: 200 OK>

        For more information on this code flow, see https://aka.ms/azsdk/dpcodegen/python/send_request

        :param request: The network request you want to make. Required.
        :type request: ~corehttp.rest.HttpRequest
        :keyword bool stream: Whether the response payload will be streamed. Defaults to False.
        :return: The response of your network call. Does not do error handling on your response.
        :rtype: ~corehttp.rest.HttpResponse
        """

        request_copy = deepcopy(request)
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
            "version": self._serialize.url("self._config.version", self._config.version, "str"),
        }

        request_copy.url = self._client.format_url(request_copy.url, **path_format_arguments)
        return self._client.send_request(request_copy, stream=stream, **kwargs)  # type: ignore

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> Self:
        self._client.__enter__()
        return self

    def __exit__(self, *exc_details: Any) -> None:
        self._client.__exit__(*exc_details)
