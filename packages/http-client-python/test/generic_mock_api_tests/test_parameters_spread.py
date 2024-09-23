# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.spread import SpreadClient
from parameters.spread.models import BodyParameter


@pytest.fixture
def client():
    with SpreadClient() as client:
        yield client


def test_model_body(client: SpreadClient):
    client.model.spread_as_request_body(name="foo")


def test_model_composite_request_only_with_body(client: SpreadClient):
    client.model.spread_composite_request_only_with_body(BodyParameter(name="foo"))


def test_model_composite_request_without_body(client: SpreadClient):
    client.model.spread_composite_request_without_body(name="foo", test_header="bar")


def test_model_composite_request(client: SpreadClient):
    client.model.spread_composite_request(name="foo", body=BodyParameter(name="foo"), test_header="bar")


def test_model_composite_request_mix(client: SpreadClient):
    client.model.spread_composite_request_mix(name="foo", prop="foo", test_header="bar")


def test_alias_body(client: SpreadClient):
    client.alias.spread_as_request_body(name="foo")


def test_alias_parameter(client: SpreadClient):
    client.alias.spread_as_request_parameter("1", x_ms_test_header="bar", name="foo")


def test_alias_multiple_parameter(client: SpreadClient):
    client.alias.spread_with_multiple_parameters(
        "1",
        x_ms_test_header="bar",
        required_string="foo",
        required_int_list=[1, 2],
        optional_string_list=["foo", "bar"],
        optional_int=1,
    )
    client.alias.spread_with_multiple_parameters(
        "1",
        {"requiredString": "foo", "optionalInt": 1, "requiredIntList": [1, 2], "optionalStringList": ["foo", "bar"]},
        x_ms_test_header="bar",
    )


def test_inner_model(client: SpreadClient):
    client.alias.spread_parameter_with_inner_model(id="1", x_ms_test_header="bar", body={"name": "foo"})


def test_inner_alias(client: SpreadClient):
    client.alias.spread_parameter_with_inner_alias(id="1", x_ms_test_header="bar", body={"name": "foo", "age": 1})
