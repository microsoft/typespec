# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from generation.subdir import CustomizedClient, Extension


def test_custom_method():
    client = CustomizedClient()
    assert client.customized_get() == Extension(
        {
            "level": 0,
            "extension": [{"level": 1, "extension": [{"level": 2}]}, {"level": 1}],
        }
    )
