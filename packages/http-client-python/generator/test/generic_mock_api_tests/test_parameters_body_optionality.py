# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.bodyoptionality import BodyOptionalityClient
from parameters.bodyoptionality.models import BodyModel


@pytest.fixture
def client():
    with BodyOptionalityClient() as client:
        yield client


def test_required_explicit(client: BodyOptionalityClient):
    client.required_explicit(BodyModel(name="foo"))


def test_required_implicit(client: BodyOptionalityClient):
    client.required_implicit(name="foo")


def test_optional_explicit(client: BodyOptionalityClient):
    client.optional_explicit.set(BodyModel(name="foo"))
    client.optional_explicit.omit()
