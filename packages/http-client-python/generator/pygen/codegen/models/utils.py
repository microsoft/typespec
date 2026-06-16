# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import TypeVar

from enum import Enum

T = TypeVar("T")
OrderedSet = dict[T, None]


CODE_BLOCK_MARKER = ".. code-block::"


def add_to_description(description: str, entry: str) -> str:
    if not description:
        return entry
    # When the description contains a code block, the entry (e.g. "Required.") must be
    # inserted into the prose *before* the code block. Appending it after the code block
    # (e.g. "]. Required.") leaves it dangling at the end of the rendered block and breaks
    # Sphinx rendering.
    if CODE_BLOCK_MARKER in description:
        prose, _, code_block = description.partition(CODE_BLOCK_MARKER)
        return f"{prose.rstrip()} {entry}\n\n{CODE_BLOCK_MARKER}{code_block}"
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

REQUEST_BUILDER_BODY_VARIABLES_LENGTH = 6  # how many body variables are present in a request builder

OPERATION_BODY_VARIABLES_LENGTH = 14  # how many body variables are present in an operation
