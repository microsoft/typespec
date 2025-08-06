# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import inspect
import pytest
from specs.azure.clientgenerator.core.override import OverrideClient


@pytest.fixture
def client():
    with OverrideClient() as client:
        yield client


def test_reorder_parameters(client: OverrideClient):
    client.reorder_parameters.reorder("param1", "param2")


def test_group_parameters(client: OverrideClient):
    client.group_parameters.group(param1="param1", param2="param2")


# make sure signature name of `reorder_parameters` are ["param1", "param2"]
def test_reorder_parameters_unit(client: OverrideClient):
    # Get the reorder method from the reorder_parameters operation
    reorder_method = client.reorder_parameters.reorder

    # Inspect the method signature
    sig = inspect.signature(reorder_method)

    # Get parameter names excluding 'self' and '**kwargs'
    param_names = [
        param_name
        for param_name, param in sig.parameters.items()
        if param_name not in ("self", "kwargs") and param.kind != param.VAR_KEYWORD
    ]

    # Assert that the parameter names are exactly ["param1", "param2"]
    assert param_names == ["param1", "param2"], f"Expected parameter names ['param1', 'param2'], but got {param_names}"
