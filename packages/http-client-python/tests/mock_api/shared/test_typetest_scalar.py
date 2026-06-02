# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import decimal
from functools import reduce

import pytest
from typetest.scalar import ScalarClient


@pytest.fixture
def client():
    with ScalarClient() as client:
        yield client


def test_scalar_string(client: ScalarClient):
    assert client.string.get() == "test"
    client.string.put("test")


def test_scalar_boolean(client: ScalarClient):
    assert client.boolean.get() == True
    client.boolean.put(True)


def test_scalar_unknown(client: ScalarClient):
    assert client.unknown.get() == "test"
    client.unknown.put("test")


def test_decimal128_type(client: ScalarClient):
    assert client.decimal128_type.response_body() == decimal.Decimal("0.33333")
    client.decimal128_type.request_body(decimal.Decimal("0.33333"))
    client.decimal128_type.request_parameter(value=decimal.Decimal("0.33333"))


def test_decimal_type(client: ScalarClient):
    assert client.decimal_type.response_body() == decimal.Decimal("0.33333")
    client.decimal_type.request_body(decimal.Decimal("0.33333"))
    client.decimal_type.request_parameter(value=decimal.Decimal("0.33333"))


def test_decimal128_verify(client: ScalarClient):
    prepare = client.decimal128_verify.prepare_verify()
    client.decimal128_verify.verify(reduce(lambda x, y: x + y, prepare))


def test_decimal_verify(client: ScalarClient):
    prepare = client.decimal_verify.prepare_verify()
    client.decimal_verify.verify(reduce(lambda x, y: x + y, prepare))
