# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for add_to_description code-block handling."""
from pygen.codegen.models.utils import add_to_description


def test_add_to_description_empty() -> None:
    assert add_to_description("", "Required.") == "Required."


def test_add_to_description_plain() -> None:
    assert add_to_description("The tools.", "Required.") == "The tools. Required."


def test_add_to_description_inserts_before_code_block() -> None:
    description = "The tools to use.\n\n.. code-block:: json\n\n   [\n     1\n   ]"
    result = add_to_description(description, "Required.")
    assert result == (
        "The tools to use. Required.\n\n.. code-block:: json\n\n   [\n     1\n   ]"
    )
    # The annotation must not be appended after the closing of the code block.
    assert not result.rstrip().endswith("Required.")


def test_add_to_description_multiple_code_blocks_inserts_before_first() -> None:
    description = (
        "Prose.\n\n.. code-block:: json\n\n   [1]\n\n.. code-block:: json\n\n   [2]"
    )
    result = add_to_description(description, "Required.")
    assert result == (
        "Prose. Required.\n\n.. code-block:: json\n\n   [1]\n\n.. code-block:: json\n\n   [2]"
    )
