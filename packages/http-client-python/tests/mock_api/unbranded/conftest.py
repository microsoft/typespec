# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from pathlib import Path

FILE_FOLDER = Path(__file__).parent


SPECIAL_WORDS = [
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "class",
    "constructor",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "exec",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield",
]


@pytest.fixture
def special_words() -> list[str]:
    return SPECIAL_WORDS


@pytest.fixture
def png_data() -> bytes:
    with open(str(FILE_FOLDER / "data/image.png"), "rb") as file_in:
        return file_in.read()


@pytest.fixture
def jpg_data() -> bytes:
    with open(str(FILE_FOLDER / "data/image.jpg"), "rb") as file_in:
        return file_in.read()
