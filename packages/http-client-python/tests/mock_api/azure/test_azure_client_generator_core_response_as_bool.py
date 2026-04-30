# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from specs.azure.clientgenerator.core.responseasbool import ResponseAsBoolClient


def test_exists():
    with ResponseAsBoolClient() as client:
        result = client.head_as_boolean.exists()
        assert result is True


def test_not_exists():
    with ResponseAsBoolClient() as client:
        result = client.head_as_boolean.not_exists()
        assert result is False
