# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from type.union.discriminated.extends.aio import ExtendsClient
from type.union.discriminated.extends.customdiscriminator import models as custom
from type.union.discriminated.extends.enumdiscriminator import models as enum
from type.union.discriminated.extends.explicitdiscriminator import models as explicit
from type.union.discriminated.extends.injecteddiscriminator import models as injected
from type.union.discriminated.extends.recursive import models as recursive


@pytest_asyncio.fixture
async def client():
    async with ExtendsClient() as client:
        yield client


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scenario,models,property_name,tags",
    [
        ("explicit_discriminator", explicit, "kind", ("cat", "dog")),
        ("injected_discriminator", injected, "kind", ("cat", "dog")),
        ("custom_discriminator", custom, "petType", ("feline", "canine")),
        ("enum_discriminator", enum, "kind", ("cat", "dog")),
    ],
)
@pytest.mark.parametrize("animal", ["cat", "dog"])
async def test_variant(client, scenario, models, property_name, tags, animal):
    operations = getattr(client, scenario).operations
    if animal == "cat":
        body = models.Cat(name="Whiskers", meow=True)
        wire = {property_name: tags[0], "name": "Whiskers", "meow": True}
    else:
        body = models.Dog(name="Rex", bark=False)
        wire = {property_name: tags[1], "name": "Rex", "bark": False}
    result = await getattr(operations, f"get_{animal}")()
    assert type(result) is type(body)
    assert isinstance(result, models.PetBase)
    assert result.as_dict() == wire
    original = body.as_dict()
    assert await getattr(operations, f"put_{animal}")(body) is None
    assert body.as_dict() == original


@pytest.mark.asyncio
async def test_recursive(client):
    dog = recursive.Dog(name="Rex", bark=False)
    body = recursive.Cat(
        name="Whiskers",
        meow=True,
        friend=dog,
        friends=[recursive.Cat(name="Kitten", meow=False)],
        lookup={"best": dog},
    )
    result = await client.recursive.get()
    assert isinstance(result, recursive.Cat)
    assert isinstance(result.friend, recursive.Dog)
    assert isinstance(result.friends[0], recursive.Cat)
    assert isinstance(result.lookup["best"], recursive.Dog)
    assert result.as_dict() == {
        "kind": "cat",
        "name": "Whiskers",
        "meow": True,
        "friend": {"kind": "dog", "name": "Rex", "bark": False},
        "friends": [{"kind": "cat", "name": "Kitten", "meow": False}],
        "lookup": {"best": {"kind": "dog", "name": "Rex", "bark": False}},
    }
    original = body.as_dict()
    original_dog = dog.as_dict()
    assert await client.recursive.put(body) is None
    assert body.as_dict() == original
    assert dog.as_dict() == original_dog
