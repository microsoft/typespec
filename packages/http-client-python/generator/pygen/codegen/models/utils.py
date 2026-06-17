# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import TypeVar

from enum import Enum

from ...utils import description_ends_with_code_block

T = TypeVar("T")
OrderedSet = dict[T, None]


def add_to_description(description: str, entry: str) -> str:
    if not description:
        return entry
    # When the description ends with a code block, append the entry (e.g. "Required.") as a
    # new paragraph after the block. Appending it inline (e.g. "]. Required.") leaves it
    # inside the rendered literal block and breaks Sphinx rendering.
    if description_ends_with_code_block(description):
        return f"{description.rstrip()}\n\n{entry}"
    return f"{description} {entry}"


def add_to_pylint_disable(curr_str: str, entry: str) -> str:
    if curr_str:
        return f"{curr_str},{entry}"
    return f"  # pylint: disable={entry}"


class NamespaceType(str, Enum):
    """Special signal for impports"""

    MODEL = "model"
    OPERATION = "operation"
    CLIENT = "client"
    TYPES_FILE = "types_file"


LOCALS_LENGTH_LIMIT = 25

REQUEST_BUILDER_BODY_VARIABLES_LENGTH = (
    6  # how many body variables are present in a request builder
)

OPERATION_BODY_VARIABLES_LENGTH = (
    14  # how many body variables are present in an operation
)
