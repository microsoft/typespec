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
import asyncio
import json
import logging
import uuid
from typing import Union

from azure.core.pipeline import PipelineRequest, PipelineResponse
from azure.core.pipeline.policies import AsyncHTTPPolicy
from azure.core.pipeline.transport import (
    HttpRequest as LegacyHttpRequest,
    AsyncHttpResponse as LegacyAsyncHttpResponse,
)
from azure.core.rest import HttpRequest, AsyncHttpResponse


from ._base import _SansIOARMAutoResourceProviderRegistrationPolicy

_LOGGER = logging.getLogger(__name__)

HTTPRequestType = Union[LegacyHttpRequest, HttpRequest]
AsyncHTTPResponseType = Union[LegacyAsyncHttpResponse, AsyncHttpResponse]
PipelineResponseType = PipelineResponse[HTTPRequestType, AsyncHTTPResponseType]


class AsyncARMAutoResourceProviderRegistrationPolicy(
    _SansIOARMAutoResourceProviderRegistrationPolicy, AsyncHTTPPolicy[HTTPRequestType, AsyncHTTPResponseType]
):  # pylint: disable=name-too-long
    """Auto register an ARM resource provider if not done yet."""

    async def send(
        self, request: PipelineRequest[HTTPRequestType]
    ) -> PipelineResponse[HTTPRequestType, AsyncHTTPResponseType]:
        http_request = request.http_request
        response = await self.next.send(request)
        if response.http_response.status_code == 409:
            rp_name = self._check_rp_not_registered_err(response)
            if rp_name:
                url_prefix = self._extract_subscription_url(http_request.url)
                register_rp_status = await self._async_register_rp(request, url_prefix, rp_name)
                if not register_rp_status:
                    return response
                # Change the 'x-ms-client-request-id' otherwise the Azure endpoint
                # just returns the same 409 payload without looking at the actual query
                if "x-ms-client-request-id" in http_request.headers:
                    http_request.headers["x-ms-client-request-id"] = str(uuid.uuid4())
                response = await self.next.send(request)
        return response

    async def _async_register_rp(
        self, initial_request: PipelineRequest[HTTPRequestType], url_prefix: str, rp_name: str
    ) -> bool:
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
        post_response = await self.next.send(self._build_next_request(initial_request, "POST", post_url))
        if post_response.http_response.status_code != 200:
            _LOGGER.warning("Registration failed. Please register manually.")
            return False

        while True:
            await asyncio.sleep(10)
            get_response = await self.next.send(self._build_next_request(initial_request, "GET", get_url))
            rp_info = json.loads(get_response.http_response.text())
            if rp_info["registrationState"] == "Registered":
                _LOGGER.warning("Registration succeeded.")
                return True
