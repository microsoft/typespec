# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import decimal
from functools import reduce

import pytest
from typetest.scalar.aio import ScalarClient


@pytest.fixture
async def client():
    async with ScalarClient() as client:
        yield client


@pytest.mark.asyncio
async def test_scalar_string(client: ScalarClient):
    assert await client.string.get() == "test"
    await client.string.put("test")


@pytest.mark.asyncio
async def test_scalar_boolean(client: ScalarClient):
    assert await client.boolean.get() == True
    await client.boolean.put(True)


@pytest.mark.asyncio
async def test_scalar_unknown(client: ScalarClient):
    assert await client.unknown.get() == "test"
    await client.unknown.put("test")


@pytest.mark.asyncio
async def test_decimal128_type(client: ScalarClient):
    assert await client.decimal128_type.response_body() == decimal.Decimal("0.33333")
    await client.decimal128_type.request_body(decimal.Decimal("0.33333"))
    await client.decimal128_type.request_parameter(value=decimal.Decimal("0.33333"))


@pytest.mark.asyncio
async def test_decimal_type(client: ScalarClient):
    assert await client.decimal_type.response_body() == decimal.Decimal("0.33333")
    await client.decimal_type.request_body(decimal.Decimal("0.33333"))
    await client.decimal_type.request_parameter(value=decimal.Decimal("0.33333"))


@pytest.mark.asyncio
async def test_decimal128_verify(client: ScalarClient):
    prepare = await client.decimal128_verify.prepare_verify()
    await client.decimal128_verify.verify(reduce(lambda x, y: x + y, prepare))


@pytest.mark.asyncio
async def test_decimal_verify(client: ScalarClient):
    prepare = await client.decimal_verify.prepare_verify()
    await client.decimal_verify.verify(reduce(lambda x, y: x + y, prepare))
