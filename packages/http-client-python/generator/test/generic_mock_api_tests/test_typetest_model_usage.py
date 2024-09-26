# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.usage import UsageClient, models


@pytest.fixture
def client():
    with UsageClient() as client:
        yield client


def test_input(client: UsageClient):
    input = models.InputRecord(required_prop="example-value")
    assert client.input(input) is None


def test_output(client: UsageClient):
    output = models.OutputRecord(required_prop="example-value")
    assert output == client.output()


def test_input_and_output(client: UsageClient):
    input_output = models.InputOutputRecord(required_prop="example-value")
    assert input_output == client.input_and_output(input_output)
