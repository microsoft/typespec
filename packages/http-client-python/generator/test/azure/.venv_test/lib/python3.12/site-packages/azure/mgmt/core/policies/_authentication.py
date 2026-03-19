# --------------------------------------------------------------------------
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# The MIT License (MIT)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the ""Software""), to
# deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
# sell copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
# IN THE SOFTWARE.
#
# --------------------------------------------------------------------------
import time
from typing import Optional, Union, MutableMapping, List, Any, Sequence, TypeVar, Generic

from azure.core.credentials import AccessToken, TokenCredential
from azure.core.credentials_async import AsyncTokenCredential
from azure.core.pipeline.policies import BearerTokenCredentialPolicy, SansIOHTTPPolicy
from azure.core.pipeline import PipelineRequest
from azure.core.exceptions import ServiceRequestError
from azure.core.pipeline.transport import (
    HttpRequest as LegacyHttpRequest,
    HttpResponse as LegacyHttpResponse,
)
from azure.core.rest import HttpRequest, HttpResponse


HTTPRequestType = Union[LegacyHttpRequest, HttpRequest]
HTTPResponseType = Union[LegacyHttpResponse, HttpResponse]
TokenCredentialType = TypeVar("TokenCredentialType", bound=Union[TokenCredential, AsyncTokenCredential])


class ARMChallengeAuthenticationPolicy(BearerTokenCredentialPolicy):
    """Adds a bearer token Authorization header to requests.

    This policy internally handles Continuous Access Evaluation (CAE) challenges. When it can't complete a challenge,
    it will return the 401 (unauthorized) response from ARM.
    """


# pylint:disable=too-few-public-methods
class _AuxiliaryAuthenticationPolicyBase(Generic[TokenCredentialType]):
    """Adds auxiliary authorization token header to requests.

    :param ~azure.core.credentials.TokenCredential auxiliary_credentials: auxiliary credential for authorizing requests
    :param str scopes: required authentication scopes
    """

    def __init__(  # pylint: disable=unused-argument
        self, auxiliary_credentials: Sequence[TokenCredentialType], *scopes: str, **kwargs: Any
    ) -> None:
        self._auxiliary_credentials = auxiliary_credentials
        self._scopes = scopes
        self._aux_tokens: Optional[List[AccessToken]] = None

    @staticmethod
    def _enforce_https(request: PipelineRequest[HTTPRequestType]) -> None:
        # move 'enforce_https' from options to context, so it persists
        # across retries but isn't passed to transport implementation
        option = request.context.options.pop("enforce_https", None)

        # True is the default setting; we needn't preserve an explicit opt in to the default behavior
        if option is False:
            request.context["enforce_https"] = option

        enforce_https = request.context.get("enforce_https", True)
        if enforce_https and not request.http_request.url.lower().startswith("https"):
            raise ServiceRequestError(
                "Bearer token authentication is not permitted for non-TLS protected (non-https) URLs."
            )

    def _update_headers(self, headers: MutableMapping[str, str]) -> None:
        """Updates the x-ms-authorization-auxiliary header with the auxiliary token.

        :param dict headers: The HTTP Request headers
        """
        if self._aux_tokens:
            headers["x-ms-authorization-auxiliary"] = ", ".join(
                "Bearer {}".format(token.token) for token in self._aux_tokens
            )

    @property
    def _need_new_aux_tokens(self) -> bool:
        if not self._aux_tokens:
            return True
        for token in self._aux_tokens:
            if token.expires_on - time.time() < 300:
                return True
        return False


class AuxiliaryAuthenticationPolicy(
    _AuxiliaryAuthenticationPolicyBase[TokenCredential],
    SansIOHTTPPolicy[HTTPRequestType, HTTPResponseType],
):
    def _get_auxiliary_tokens(self, *scopes: str, **kwargs: Any) -> Optional[List[AccessToken]]:
        if self._auxiliary_credentials:
            return [cred.get_token(*scopes, **kwargs) for cred in self._auxiliary_credentials]
        return None

    def on_request(self, request: PipelineRequest[HTTPRequestType]) -> None:
        """Called before the policy sends a request.

        The base implementation authorizes the request with an auxiliary authorization token.

        :param ~azure.core.pipeline.PipelineRequest request: the request
        """
        self._enforce_https(request)

        if self._need_new_aux_tokens:
            self._aux_tokens = self._get_auxiliary_tokens(*self._scopes)

        self._update_headers(request.http_request.headers)
