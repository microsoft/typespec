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

from azure.core.pipeline.policies import HttpLoggingPolicy
from ._authentication import (
    ARMChallengeAuthenticationPolicy,
    AuxiliaryAuthenticationPolicy,
)
from ._base import ARMAutoResourceProviderRegistrationPolicy
from ._authentication_async import (
    AsyncARMChallengeAuthenticationPolicy,
    AsyncAuxiliaryAuthenticationPolicy,
)
from ._base_async import AsyncARMAutoResourceProviderRegistrationPolicy


class ARMHttpLoggingPolicy(HttpLoggingPolicy):
    """HttpLoggingPolicy with ARM specific safe headers fopr loggers."""

    DEFAULT_HEADERS_ALLOWLIST = HttpLoggingPolicy.DEFAULT_HEADERS_ALLOWLIST | set(
        [
            # https://docs.microsoft.com/azure/azure-resource-manager/management/request-limits-and-throttling#remaining-requests
            "x-ms-ratelimit-remaining-subscription-reads",
            "x-ms-ratelimit-remaining-subscription-writes",
            "x-ms-ratelimit-remaining-tenant-reads",
            "x-ms-ratelimit-remaining-tenant-writes",
            "x-ms-ratelimit-remaining-subscription-resource-requests",
            "x-ms-ratelimit-remaining-subscription-resource-entities-read",
            "x-ms-ratelimit-remaining-tenant-resource-requests",
            "x-ms-ratelimit-remaining-tenant-resource-entities-read",
            # https://docs.microsoft.com/azure/virtual-machines/troubleshooting/troubleshooting-throttling-errors#call-rate-informational-response-headers
            "x-ms-ratelimit-remaining-resource",
            "x-ms-request-charge",
        ]
    )


__all__ = [
    "ARMAutoResourceProviderRegistrationPolicy",
    "ARMChallengeAuthenticationPolicy",
    "ARMHttpLoggingPolicy",
    "AsyncARMAutoResourceProviderRegistrationPolicy",
    "AsyncARMChallengeAuthenticationPolicy",
    "AuxiliaryAuthenticationPolicy",
    "AsyncAuxiliaryAuthenticationPolicy",
]
