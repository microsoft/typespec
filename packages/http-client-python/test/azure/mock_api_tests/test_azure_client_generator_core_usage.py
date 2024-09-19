# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.usage import UsageClient
from specs.azure.clientgenerator.core.usage import models


@pytest.fixture
def client():
    with UsageClient() as client:
        yield client


def test_input_to_input_output(client: UsageClient):
    client.model_in_operation.input_to_input_output(models.InputModel(name="Madge"))


def test_output_to_input_output(client: UsageClient):
    assert models.OutputModel(name="Madge") == client.model_in_operation.output_to_input_output()


def test_model_usage(client: UsageClient):
    assert models.RoundTripModel(
        result=models.ResultModel(name="Madge")
    ) == client.model_in_operation.model_in_read_only_property(body=models.RoundTripModel())
