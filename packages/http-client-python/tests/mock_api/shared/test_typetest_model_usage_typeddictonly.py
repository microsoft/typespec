# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.usage.typeddictonly import UsageClient
from typetest.model.usage.typeddictonly.types import InputRecord, OutputRecord, InputOutputRecord


@pytest.fixture
def client():
    with UsageClient() as client:
        yield client


def test_input(client: UsageClient):
    # TypedDict-only: pass a plain dict matching the TypedDict schema
    result = client.input({"requiredProp": "example-value"})
    assert result is None


def test_output(client: UsageClient):
    # TypedDict-only: output should be a plain dict (no model deserialization)
    output = client.output()
    assert isinstance(output, dict)
    assert output["requiredProp"] == "example-value"


def test_input_and_output(client: UsageClient):
    # TypedDict-only: input a dict, get a dict back
    result = client.input_and_output({"requiredProp": "example-value"})
    assert isinstance(result, dict)
    assert result["requiredProp"] == "example-value"


def test_no_model_classes():
    """Verify that typed-dict-only models don't generate model classes."""
    from typetest.model.usage.typeddictonly import models

    # models.__all__ should be empty — no model classes exported
    assert models.__all__ == []
    # The TypedDicts should only exist in the types module
    assert hasattr(InputRecord, "__required_keys__") or hasattr(InputRecord, "__annotations__")
