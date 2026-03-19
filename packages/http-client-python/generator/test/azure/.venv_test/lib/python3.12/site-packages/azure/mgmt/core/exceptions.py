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
from typing import Mapping, Any, Sequence
import json
import logging


from azure.core.exceptions import ODataV4Format


_LOGGER = logging.getLogger(__name__)


class TypedErrorInfo:
    """Additional info class defined in ARM specification.

    https://github.com/Azure/azure-resource-manager-rpc/blob/master/v1.0/common-api-details.md#error-response-content
    """

    def __init__(self, type: str, info: Mapping[str, Any]) -> None:  # pylint: disable=redefined-builtin
        self.type = type
        self.info = info

    def __str__(self) -> str:
        """Cloud error message.

        :return: The cloud error message.
        :rtype: str
        """
        error_str = "Type: {}".format(self.type)
        error_str += "\nInfo: {}".format(json.dumps(self.info, indent=4))
        return error_str


class ARMErrorFormat(ODataV4Format):
    """Describe error format from ARM, used at the base or inside "details" node.

    This format is compatible with ODataV4 format.
    https://github.com/Azure/azure-resource-manager-rpc/blob/master/v1.0/common-api-details.md#error-response-content
    """

    def __init__(self, json_object: Mapping[str, Any]) -> None:
        # Parse the ODatav4 part
        super(ARMErrorFormat, self).__init__(json_object)
        if "error" in json_object:
            json_object = json_object["error"]

        # ARM specific annotations
        self.additional_info: Sequence[TypedErrorInfo] = [
            TypedErrorInfo(additional_info["type"], additional_info["info"])
            for additional_info in json_object.get("additionalInfo", [])
        ]

    def __str__(self) -> str:
        error_str = super(ARMErrorFormat, self).__str__()

        if self.additional_info:
            error_str += "\nAdditional Information:"
            for error_info in self.additional_info:
                error_str += str(error_info)

        return error_str
