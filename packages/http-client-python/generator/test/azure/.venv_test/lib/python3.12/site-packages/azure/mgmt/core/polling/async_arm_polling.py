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
from typing import Optional, Dict, Any, Sequence

from azure.core.polling.base_polling import LocationPolling, StatusCheckPolling, LongRunningOperation
from azure.core.polling.async_base_polling import AsyncLROBasePolling

from .arm_polling import AzureAsyncOperationPolling, BodyContentPolling, HttpRequestTypeVar, AllHttpResponseTypeVar


class AsyncARMPolling(AsyncLROBasePolling):
    def __init__(
        self,
        timeout: float = 30,
        lro_algorithms: Optional[Sequence[LongRunningOperation[HttpRequestTypeVar, AllHttpResponseTypeVar]]] = None,
        lro_options: Optional[Dict[str, Any]] = None,
        path_format_arguments: Optional[Dict[str, str]] = None,
        **operation_config: Any
    ) -> None:
        lro_algorithms = lro_algorithms or [
            AzureAsyncOperationPolling(lro_options=lro_options),
            LocationPolling(),
            BodyContentPolling(),
            StatusCheckPolling(),
        ]
        super(AsyncLROBasePolling, self).__init__(
            timeout=timeout,
            lro_algorithms=lro_algorithms,
            lro_options=lro_options,
            path_format_arguments=path_format_arguments,
            **operation_config
        )


__all__ = ["AsyncARMPolling"]
