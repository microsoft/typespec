# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.bodyroot import BodyRootClient
from parameters.bodyroot.models import BodyRootModel


@pytest.fixture
def client():
    with BodyRootClient() as client:
        yield client


def test_nested(client: BodyRootClient):
    client.nested(BodyRootModel(category="widget", link_type="hard", was_successful=True))
