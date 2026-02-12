# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import inspect
import pytest
from specs.azure.clientgenerator.core.override.aio import OverrideClient


@pytest.fixture
async def client():
    async with OverrideClient() as client:
        yield client


@pytest.mark.asyncio
async def test_reorder_parameters(client: OverrideClient):
    await client.reorder_parameters.reorder("param1", "param2")


@pytest.mark.asyncio
async def test_group_parameters(client: OverrideClient):
    await client.group_parameters.group(param1="param1", param2="param2")


@pytest.mark.asyncio
async def test_require_optional_parameter(client: OverrideClient):
    await client.require_optional_parameter.require_optional("param1", "param2")


@pytest.mark.asyncio
async def test_remove_optional_parameter(client: OverrideClient):
    # Test with optional param2 provided
    await client.remove_optional_parameter.remove_optional("param1", param2="param2")


def test_reorder_parameters_unit_async(client: OverrideClient):
    # make sure signature name of `reorder_parameters` are ["param1", "param2"]
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


def test_require_optional_parameter_signature(client: OverrideClient):
    # Get the require_optional method
    require_optional_method = client.require_optional_parameter.require_optional

    # Inspect the method signature
    sig = inspect.signature(require_optional_method)

    # Get parameter details
    params = sig.parameters

    # Check that both param1 and param2 are required (no default values)
    assert "param1" in params, "param1 should be present in signature"
    assert "param2" in params, "param2 should be present in signature"
    assert params["param1"].default == params["param1"].empty, "param1 should have no default value"
    assert params["param2"].default == params["param2"].empty, "param2 should have no default value"


def test_remove_optional_parameter_signature(client: OverrideClient):
    """Test that remove_optional_parameter.remove_optional method signature has correct parameters.

    The @override decorator should remove some optional parameters from the method signature.
    Only param1 (required) and param2 (optional) should remain.
    """
    # Get the remove_optional method
    remove_optional_method = client.remove_optional_parameter.remove_optional

    # Inspect the method signature
    sig = inspect.signature(remove_optional_method)

    # Get parameter names excluding 'self' and '**kwargs'
    param_names = [
        param_name
        for param_name, param in sig.parameters.items()
        if param_name not in ("self", "kwargs") and param.kind != param.VAR_KEYWORD
    ]

    # Should have param1 (required) and param2 (keyword-only optional)
    assert "param1" in param_names, "param1 should be present in signature"
    assert "param2" in sig.parameters, "param2 should be present in signature"

    # param1 should be required (positional)
    assert sig.parameters["param1"].default == sig.parameters["param1"].empty, "param1 should have no default value"

    # param2 should be optional keyword-only with None default
    assert sig.parameters["param2"].kind == sig.parameters["param2"].KEYWORD_ONLY, "param2 should be keyword-only"
    assert sig.parameters["param2"].default is None, "param2 should have None as default value"

    # param3 and param4 should be removed
    assert "param3" not in param_names, "param3 should not be present in signature"
    assert "param4" not in param_names, "param4 should not be present in signature"
