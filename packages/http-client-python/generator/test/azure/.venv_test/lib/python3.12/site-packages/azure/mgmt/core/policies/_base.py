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
import json
import logging
import re
import time
import uuid
from typing import Union, Optional, cast

from azure.core.pipeline import PipelineContext, PipelineRequest, PipelineResponse
from azure.core.pipeline.policies import HTTPPolicy
from azure.core.pipeline.transport import (
    HttpRequest as LegacyHttpRequest,
    HttpResponse as LegacyHttpResponse,
    AsyncHttpResponse as LegacyAsyncHttpResponse,
)
from azure.core.rest import HttpRequest, HttpResponse, AsyncHttpResponse


_LOGGER = logging.getLogger(__name__)

HTTPRequestType = Union[LegacyHttpRequest, HttpRequest]
HTTPResponseType = Union[LegacyHttpResponse, HttpResponse]
AllHttpResponseType = Union[
    LegacyHttpResponse, HttpResponse, LegacyAsyncHttpResponse, AsyncHttpResponse
]  # Sync or async


class _SansIOARMAutoResourceProviderRegistrationPolicy:
    @staticmethod
    def _check_rp_not_registered_err(response: PipelineResponse[HTTPRequestType, AllHttpResponseType]) -> Optional[str]:
        try:
            response_as_json = json.loads(response.http_response.text())
            if response_as_json["error"]["code"] == "MissingSubscriptionRegistration":
                # While "match" can in theory be None, if we saw "MissingSubscriptionRegistration" it won't happen
                match = cast(re.Match, re.match(r".*'(.*)'", response_as_json["error"]["message"]))
                return match.group(1)
        except Exception:  # pylint: disable=broad-except
            pass
        return None

    @staticmethod
    def _extract_subscription_url(url: str) -> str:
        """Extract the first part of the URL, just after subscription:
        https://management.azure.com/subscriptions/00000000-0000-0000-0000-000000000000/

        :param str url: The URL to extract the subscription ID from
        :return: The subscription ID
        :rtype: str
        """
        match = re.match(r".*/subscriptions/[a-f0-9-]+/", url, re.IGNORECASE)
        if not match:
            raise ValueError("Unable to extract subscription ID from URL")
        return match.group(0)

    @staticmethod
    def _build_next_request(
        initial_request: PipelineRequest[HTTPRequestType], method: str, url: str
    ) -> PipelineRequest[HTTPRequestType]:
        request = HttpRequest(method, url)
        context = PipelineContext(initial_request.context.transport, **initial_request.context.options)
        return PipelineRequest(request, context)


class ARMAutoResourceProviderRegistrationPolicy(
    _SansIOARMAutoResourceProviderRegistrationPolicy, HTTPPolicy[HTTPRequestType, HTTPResponseType]
):  # pylint: disable=name-too-long
    """Auto register an ARM resource provider if not done yet."""

    def send(self, request: PipelineRequest[HTTPRequestType]) -> PipelineResponse[HTTPRequestType, HTTPResponseType]:
        http_request = request.http_request
        response = self.next.send(request)
        if response.http_response.status_code == 409:
            rp_name = self._check_rp_not_registered_err(response)
            if rp_name:
                url_prefix = self._extract_subscription_url(http_request.url)
                if not self._register_rp(request, url_prefix, rp_name):
                    return response
                # Change the 'x-ms-client-request-id' otherwise the Azure endpoint
                # just returns the same 409 payload without looking at the actual query
                if "x-ms-client-request-id" in http_request.headers:
                    http_request.headers["x-ms-client-request-id"] = str(uuid.uuid4())
                response = self.next.send(request)
        return response

    def _register_rp(self, initial_request: PipelineRequest[HTTPRequestType], url_prefix: str, rp_name: str) -> bool:
        """Synchronously register the RP is paremeter.

        Return False if we have a reason to believe this didn't work

        :param initial_request: The initial request
        :type initial_request: ~azure.core.pipeline.PipelineRequest
        :param str url_prefix: The url prefix
        :param str rp_name: The resource provider name
        :return: Return False if we have a reason to believe this didn't work
        :rtype: bool
        """
        post_url = "{}providers/{}/register?api-version=2016-02-01".format(url_prefix, rp_name)
        get_url = "{}providers/{}?api-version=2016-02-01".format(url_prefix, rp_name)
        _LOGGER.warning(
            "Resource provider '%s' used by this operation is not registered. We are registering for you.",
            rp_name,
        )
        post_response = self.next.send(self._build_next_request(initial_request, "POST", post_url))
        if post_response.http_response.status_code != 200:
            _LOGGER.warning("Registration failed. Please register manually.")
            return False

        while True:
            time.sleep(10)
            get_response = self.next.send(self._build_next_request(initial_request, "GET", get_url))
            rp_info = json.loads(get_response.http_response.text())
            if rp_info["registrationState"] == "Registered":
                _LOGGER.warning("Registration succeeded.")
                return True
