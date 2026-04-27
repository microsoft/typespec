# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import importlib
from pathlib import Path

DATA_FOLDER = Path(__file__).parent.parent


"""
Use to disambiguate the core library we use
"""


@pytest.fixture
def core_library():
    try:
        return importlib.import_module("azure.core")
    except ModuleNotFoundError:
        return importlib.import_module("corehttp")


@pytest.fixture
def key_credential(core_library):
    try:
        return core_library.credentials.AzureKeyCredential
    except AttributeError:
        return core_library.credentials.ServiceKeyCredential


@pytest.fixture
def png_data() -> bytes:
    with open(str(DATA_FOLDER / "data/image.png"), "rb") as file_in:
        return file_in.read()


@pytest.fixture
def jpg_data() -> bytes:
    with open(str(DATA_FOLDER / "data/image.jpg"), "rb") as file_in:
        return file_in.read()
