# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specialwords.aio import SpecialWordsClient
from specialwords.models import models
from specialwords.modelproperties import models as model_properties_models


@pytest.fixture
async def client():
    async with SpecialWordsClient() as client:
        yield client


@pytest.mark.asyncio
async def test_operations(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "_method"
        await getattr(client.operations, sw + suffix)()


@pytest.mark.asyncio
async def test_parameter(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "_parameter"
        await getattr(client.parameters, "with_" + sw)(**{sw + suffix: "ok"})
    await client.parameters.with_cancellation_token(cancellation_token="ok")


@pytest.mark.asyncio
async def test_model(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "Model"
        model = getattr(models, sw.capitalize() + suffix)
        await getattr(client.models, "with_" + sw)(model(name="ok"))


@pytest.mark.asyncio
async def test_model_properties(client: SpecialWordsClient):
    await client.model_properties.same_as_model(model_properties_models.SameAsModel(same_as_model="ok"))


@pytest.mark.asyncio
async def test_model_properties_dict_methods(client: SpecialWordsClient):
    await client.model_properties.dict_methods(
        body=model_properties_models.DictMethods(
            keys_property="ok",
            items_property="ok",
            values_property="ok",
            popitem_property="ok",
            clear_property="ok",
            update_property="ok",
            setdefault_property="ok",
            pop_property="ok",
            get_property="ok",
            copy_property="ok",
        )
    )


@pytest.mark.asyncio
async def test_model_properties_with_list(client: SpecialWordsClient):
    await client.model_properties.with_list(model_properties_models.ModelWithList(list="ok"))
