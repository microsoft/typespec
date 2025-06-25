# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specialwords import SpecialWordsClient, models


@pytest.fixture
def client():
    with SpecialWordsClient() as client:
        yield client


def test_operations(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "_method"
        getattr(client.operations, sw + suffix)()


def test_parameter(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "_parameter"
        getattr(client.parameters, "with_" + sw)(**{sw + suffix: "ok"})
    client.parameters.with_cancellation_token(cancellation_token="ok")


def test_model(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "Model"
        model = getattr(models, sw.capitalize() + suffix)
        getattr(client.models, "with_" + sw)(model(name="ok"))


def test_model_properties(client: SpecialWordsClient):
    client.model_properties.same_as_model(models.SameAsModel(same_as_model="ok"))
