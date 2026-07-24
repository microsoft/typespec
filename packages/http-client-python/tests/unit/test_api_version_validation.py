# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for the ``@api_version_validation`` decorator emission.

Regression coverage for the bug where the generated ``_validation.py`` decorator
hardcoded ``client._config.api_version``. When the versioning parameter is named
something other than ``apiVersion`` (e.g. Azure Storage names it ``version`` via
``@apiVersion @header("x-ms-version") version: string``), the config attribute is
``self.version`` and NOT ``self.api_version``. The hardcoded lookup then raised
``AttributeError`` which the decorator silently swallowed, disabling ALL
api-version validation for those clients.

The fix threads the real config attribute name (the api-version parameter's
``client_name``) into the decorator via a ``client_api_version_name`` kwarg,
emitted only when it differs from the default ``api_version``.
"""

import pytest

from pygen.codegen.models import (
    Client,
    CodeModel,
    Operation,
    ParameterList,
    RequestBuilder,
)
from pygen.codegen.models.parameter import ConfigParameter
from pygen.codegen.models.parameter_list import (
    ClientGlobalParameterList,
    RequestBuilderParameterList,
)
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.serializers.builder_serializer import OperationSerializer


@pytest.fixture
def code_model():
    return CodeModel(
        {
            "clients": [
                {
                    "name": "client",
                    "namespace": "blah",
                    "moduleName": "blah",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": "namespace",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": "dpg",
            "version-tolerant": True,
        },
    )


def _client(code_model):
    return Client(
        {
            "name": "client",
            "namespace": "blah",
            "moduleName": "blah",
            "parameters": [],
            "url": "",
            "operationGroups": [],
        },
        code_model,
        parameters=ClientGlobalParameterList({}, code_model, parameters=[]),
    )


def _api_version_config_parameter(code_model, client_name: str) -> ConfigParameter:
    return ConfigParameter(
        yaml_data={
            "clientName": client_name,
            "optional": True,
            "location": "query",
            "wireName": "api-version",
            "implementation": "Client",
            "isApiVersion": True,
            "description": "The API version.",
        },
        code_model=code_model,
        type=StringType({"type": "string"}, code_model),
    )


def _operation(code_model, client):
    request_builder = RequestBuilder(
        yaml_data={
            "url": "http://fake.com",
            "method": "GET",
            "groupName": "blah",
            "isOverload": False,
            "apiVersions": ["2023-01-01"],
        },
        client=client,
        code_model=code_model,
        name="do_thing_request",
        parameters=RequestBuilderParameterList({}, code_model, parameters=[]),
    )
    return Operation(
        yaml_data={
            "url": "http://fake.com",
            "method": "GET",
            "groupName": "blah",
            "isOverload": False,
            "apiVersions": ["2023-01-01"],
            "addedOn": "2023-01-01",
        },
        client=client,
        code_model=code_model,
        request_builder=request_builder,
        name="do_thing",
        parameters=ParameterList({}, code_model, parameters=[]),
        responses=[],
        exceptions=[],
    )


def _serializer(code_model):
    return OperationSerializer(code_model, async_mode=False, client_namespace="blah")


def test_emits_client_api_version_name_when_param_is_not_api_version(code_model):
    # Storage-like: the versioning parameter is named ``version`` -> config attr
    # is ``self.version``, so the decorator must be told to read that attribute.
    client = _client(code_model)
    client.config.parameters.parameters.append(
        _api_version_config_parameter(code_model, "version")
    )
    operation = _operation(code_model, client)

    decorator = _serializer(code_model)._api_version_validation(operation)

    assert '    client_api_version_name="version",' in decorator


def test_no_kwarg_when_param_is_conventional_api_version(code_model):
    # Conventional ``apiVersion`` -> config attr is ``self.api_version`` which is
    # the decorator default, so no kwarg should be emitted (keeps regen churn low).
    client = _client(code_model)
    client.config.parameters.parameters.append(
        _api_version_config_parameter(code_model, "api_version")
    )
    operation = _operation(code_model, client)

    decorator = _serializer(code_model)._api_version_validation(operation)

    assert decorator  # decorator is still emitted (operation has addedOn)
    assert "client_api_version_name" not in decorator


def test_no_kwarg_when_no_api_version_param(code_model):
    client = _client(code_model)
    operation = _operation(code_model, client)

    decorator = _serializer(code_model)._api_version_validation(operation)

    assert decorator
    assert "client_api_version_name" not in decorator
