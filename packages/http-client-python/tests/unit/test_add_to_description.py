# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for add_to_description code-block handling."""
from pygen.codegen.models.utils import add_to_description
from pygen.preprocess import update_description


def test_add_to_description_empty() -> None:
    assert add_to_description("", "Required.") == "Required."


def test_add_to_description_empty_entry_returns_description_unchanged() -> None:
    # An empty entry (e.g. an empty type_description) must not introduce a leading/trailing space.
    description = "The tools to use.\n\n.. code-block:: json\n\n   [\n     1\n   ]"
    assert add_to_description(description, "") == description
    assert add_to_description("The tools.", "") == "The tools."


def test_add_to_description_plain() -> None:
    assert add_to_description("The tools.", "Required.") == "The tools. Required."


def test_add_to_description_prepends_before_code_block_description() -> None:
    description = "The tools to use.\n\n.. code-block:: json\n\n   [\n     1\n   ]"
    result = add_to_description(description, "Required.")
    # The annotation goes in front of the description so the code block stays at the very
    # end where it renders cleanly, instead of inline after the block ("]. Required.").
    assert result == (
        "Required. The tools to use.\n\n.. code-block:: json\n\n   [\n     1\n   ]"
    )
    assert result.startswith("Required. ")
    assert "]. Required." not in result


def test_add_to_description_multiple_code_blocks_prepends() -> None:
    description = (
        "Prose.\n\n.. code-block:: json\n\n   [1]\n\n.. code-block:: json\n\n   [2]"
    )
    result = add_to_description(description, "Required.")
    assert result == (
        "Required. Prose.\n\n.. code-block:: json\n\n   [1]\n\n.. code-block:: json\n\n   [2]"
    )


def test_add_to_description_code_block_followed_by_prose_appends_at_end() -> None:
    # When prose follows the code block, the block is not the trailing content, so the
    # annotation is appended inline at the very end as usual.
    description = "Intro.\n\n.. code-block:: json\n\n   [1]\n\nMore prose."
    result = add_to_description(description, "Required.")
    assert result == (
        "Intro.\n\n.. code-block:: json\n\n   [1]\n\nMore prose. Required."
    )


def test_add_to_description_prose_after_last_block_appends_inline() -> None:
    # Multiple blocks, but prose follows the last one, so it is not the trailing content
    # and the annotation is appended inline at the very end.
    description = (
        "First:\n\n.. code-block:: json\n\n   [1]\n\n"
        "Second:\n\n.. code-block:: json\n\n   [2]\n\nFinal prose."
    )
    result = add_to_description(description, "Required.")
    assert result == description + " Required."


def test_multiple_required_params_in_one_docstring_are_independent() -> None:
    # A single method/model docstring is assembled from several params/properties,
    # each built from its OWN description (see builder_serializer.param_description and
    # the model templates). This verifies that a code-block param and a plain required
    # param placed in the same docstring do not interfere: each "Required." is anchored
    # to its own description, and the code-block param keeps the block at its end.
    tools_desc = add_to_description(
        "A list of tool definitions.\n\n.. code-block:: json\n\n   [1]", "Required."
    )
    mode_desc = add_to_description("Constrains the tools available.", "Required.")

    docstring_lines = [
        f":ivar tools: {tools_desc}",
        ":vartype tools: list[dict[str, any]]",
        f":ivar mode: {mode_desc}",
        ":vartype mode: str",
    ]
    docstring = "\n".join(docstring_lines)

    # The code-block param gets "Required." in front, before the prose and block.
    assert (
        ":ivar tools: Required. A list of tool definitions.\n\n.. code-block:: json\n\n   [1]"
        in docstring
    )
    # The plain required param is unaffected and still gets its trailing "Required.".
    assert ":ivar mode: Constrains the tools available. Required." in docstring
    # No "Required." dangles inline right after a code block's contents.
    assert "[1]. Required." not in docstring


def test_update_description_no_period_inside_trailing_code_block() -> None:
    # preprocess.update_description normally appends a trailing "." so descriptions end
    # in a sentence. When the description ends with a code block, that "." would land on
    # the block's last content line (e.g. "].") and break Sphinx, so it must be skipped.
    description = "The tools.\n\n.. code-block:: json\n\n   [\n     1\n   ]"
    assert update_description(description) == description
    assert "]." not in update_description(description)


def test_update_description_full_pipeline_with_code_block() -> None:
    # Mirrors the real flow: preprocess.update_description runs first, then
    # property/parameter add "Required." via add_to_description.
    raw = (
        "A list of tool definitions might look like:\n\n.. code-block:: json\n\n   [1]"
    )
    preprocessed = update_description(raw)
    result = add_to_description(preprocessed, "Required.")
    assert result == (
        "Required. A list of tool definitions might look like:\n\n.. code-block:: json\n\n   [1]"
    )
    # The block stays clean: no period and no annotation jammed onto its last line.
    assert "]." not in result
    assert result.startswith("Required. ")


def test_update_description_still_adds_period_for_plain_text() -> None:
    assert update_description("The tools") == "The tools."
    assert update_description("The tools.") == "The tools."


def test_update_description_accepts_non_string_description() -> None:
    assert update_description(1) == "1."


def test_inline_code_block_mention_is_not_treated_as_trailing_block() -> None:
    # ".. code-block::" mentioned inline in a sentence is not a real directive, so the
    # description does not "end" with a code block: the trailing period is still added and
    # the annotation is appended inline.
    description = "Use .. code-block:: json directives in your text"
    assert update_description(description) == description + "."
    assert add_to_description(description, "Required.") == description + " Required."
