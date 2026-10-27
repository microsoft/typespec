# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for the generated ``_validation.py`` ``@api_version_validation`` decorator.

Regression coverage for the bug where the generated ``_validation.py`` decorator
hardcoded ``client._config.api_version``. When the versioning parameter is named
something other than ``apiVersion`` (e.g. Azure Storage names it ``version`` via
``@apiVersion @header("x-ms-version") version: string``), the config attribute is
``self.version`` and NOT ``self.api_version``. The hardcoded lookup then raised
``AttributeError`` which the decorator silently swallowed, disabling ALL
api-version validation for those clients.

The fix bakes the real config attribute name (the api-version parameter's
``client_name``) into the rendered ``_validation.py`` so the decorator reads
``config.<client_name>`` directly.
"""

import pytest
from jinja2 import Environment, PackageLoader

from pygen.codegen.models import Client, CodeModel
from pygen.codegen.models.parameter import ConfigParameter
from pygen.codegen.models.parameter_list import ClientGlobalParameterList
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.serializers.general_serializer import GeneralSerializer


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
            "flavor": "azure",
        },
    )


def _env() -> Environment:
    return Environment(
        loader=PackageLoader("pygen.codegen", "templates"),
        keep_trailing_newline=True,
        line_statement_prefix="##",
        line_comment_prefix="###",
        trim_blocks=True,
        lstrip_blocks=True,
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


def _client_with_api_version(code_model, client_name):
    client = Client(
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
    if client_name is not None:
        client.config.parameters.parameters.append(_api_version_config_parameter(code_model, client_name))
    code_model.clients = [client]
    return client


def _render(code_model) -> str:
    return GeneralSerializer(code_model=code_model, env=_env()).serialize_validation_file()


def test_reads_version_attribute_for_non_conventional_param(code_model):
    # Storage-like: the versioning parameter is named ``version`` -> config attr
    # is ``self.version``, so the decorator must read ``config.version`` directly.
    _client_with_api_version(code_model, "version")

    rendered = _render(code_model)

    assert "client_api_version = client._config.version" in rendered
    assert "config.api_version" not in rendered
    assert "getattr(" not in rendered


def test_reads_api_version_attribute_for_conventional_param(code_model):
    _client_with_api_version(code_model, "api_version")

    rendered = _render(code_model)

    assert "client_api_version = client._config.api_version" in rendered


def test_defaults_to_api_version_when_no_api_version_param(code_model):
    _client_with_api_version(code_model, None)

    rendered = _render(code_model)

    assert "client_api_version = client._config.api_version" in rendered


def test_api_version_config_attr_name_helper(code_model):
    _client_with_api_version(code_model, "version")
    serializer = GeneralSerializer(code_model=code_model, env=_env())

    assert serializer._api_version_config_attr_name() == "version"
