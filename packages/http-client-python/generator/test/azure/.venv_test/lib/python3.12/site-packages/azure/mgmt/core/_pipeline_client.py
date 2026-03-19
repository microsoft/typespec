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
from typing import TypeVar, Any
from collections.abc import MutableSequence
from azure.core import PipelineClient
from .policies import ARMAutoResourceProviderRegistrationPolicy, ARMHttpLoggingPolicy

HTTPResponseType = TypeVar("HTTPResponseType")
HTTPRequestType = TypeVar("HTTPRequestType")


class ARMPipelineClient(PipelineClient[HTTPRequestType, HTTPResponseType]):
    """A pipeline client designed for ARM explicitly.

    :param str base_url: URL for the request.
    :keyword Pipeline pipeline: If omitted, a Pipeline object is created and returned.
    :keyword list[HTTPPolicy] policies: If omitted, the standard policies of the configuration object is used.
    :keyword per_call_policies: If specified, the policies will be added into the policy list before RetryPolicy
    :paramtype per_call_policies: Union[HTTPPolicy, SansIOHTTPPolicy, list[HTTPPolicy], list[SansIOHTTPPolicy]]
    :keyword per_retry_policies: If specified, the policies will be added into the policy list after RetryPolicy
    :paramtype per_retry_policies: Union[HTTPPolicy, SansIOHTTPPolicy, list[HTTPPolicy], list[SansIOHTTPPolicy]]
    :keyword HttpTransport transport: If omitted, RequestsTransport is used for synchronous transport.
    """

    def __init__(self, base_url: str, **kwargs: Any) -> None:
        if "policies" not in kwargs:
            config = kwargs.get("config")
            if not config:
                raise ValueError("Current implementation requires to pass 'config' if you don't pass 'policies'")
            per_call_policies = kwargs.get("per_call_policies", [])
            if isinstance(per_call_policies, MutableSequence):
                per_call_policies.append(ARMAutoResourceProviderRegistrationPolicy())
            else:
                per_call_policies = [
                    per_call_policies,
                    ARMAutoResourceProviderRegistrationPolicy(),
                ]
            kwargs["per_call_policies"] = per_call_policies
            if not config.http_logging_policy:
                config.http_logging_policy = kwargs.get("http_logging_policy", ARMHttpLoggingPolicy(**kwargs))
            kwargs["config"] = config
        super(ARMPipelineClient, self).__init__(base_url, **kwargs)
