# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import importlib
import pytest


@pytest.fixture
def core_library():
    try:
        return importlib.import_module("azure.core")
    except ModuleNotFoundError:
        return importlib.import_module("corehttp")
