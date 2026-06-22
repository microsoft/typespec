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
    if not entry:
        return description
    # When the description ends with a code block, prepend the entry (e.g. "Required.") so
    # it appears before the prose instead of after the block. Appending inline (e.g.
    # "]. Required.") would land it inside the rendered literal block and break Sphinx, and a
    # trailing paragraph reads awkwardly. The code block stays at the very end where it renders
    # cleanly. (Code-block descriptions only ever carry a single annotation in practice.)
    if description_ends_with_code_block(description):
        return f"{entry} {description.lstrip()}"
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
    UNIONS_FILE = "unions_file"


LOCALS_LENGTH_LIMIT = 25

REQUEST_BUILDER_BODY_VARIABLES_LENGTH = (
    6  # how many body variables are present in a request builder
)

OPERATION_BODY_VARIABLES_LENGTH = (
    14  # how many body variables are present in an operation
)
