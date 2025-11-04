# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import hashlib
from pathlib import Path

_FILE_PATH = Path(__file__)


def string_to_hash_id(input_string):
    """
    Converts a string to a SHA256 hash ID.

    Args:
        input_string (str): The string to be hashed.

    Returns:
        str: The hexadecimal representation of the SHA256 hash.
    """
    # Encode the string to bytes, which is required by hashlib
    encoded_string = input_string.encode("utf-8")

    # Create a SHA256 hash object
    hasher = hashlib.sha256()

    # Update the hash object with the encoded string
    hasher.update(encoded_string)

    # Get the hexadecimal representation of the hash
    hash_id = hasher.hexdigest()

    return hash_id


def test_docstring_generation():
    import azure.docstring

    with open(
        _FILE_PATH.parent.parent / "azure/generated/docstring/azure/docstring/models/_models.py", "r", encoding="utf-8"
    ) as f:
        content = f.read()
        hash_id = string_to_hash_id(content)

        # We expect there shall be no changes for each regeneration so that we could make sure generated docstring is stable.
        # Of course, if there are intentional changes to docstring generation logic, we need to update the expected hash value accordingly.
        assert hash_id == "fe6f89d00143221dcedfb4ce69440600099662aa0ecf933ab463c4d2518ba3d0"
