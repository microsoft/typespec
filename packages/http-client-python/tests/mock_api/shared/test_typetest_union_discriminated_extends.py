# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from type.union.discriminated.extends import ExtendsClient
from type.union.discriminated.extends.customdiscriminator import models as custom
from type.union.discriminated.extends.enumdiscriminator import models as enum
from type.union.discriminated.extends.explicitdiscriminator import models as explicit
from type.union.discriminated.extends.injecteddiscriminator import models as injected
from type.union.discriminated.extends.recursive import models as recursive


@pytest.fixture
def client():
    with ExtendsClient() as client:
        yield client


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
def test_variant(client, scenario, models, property_name, tags, animal):
    operations = getattr(client, scenario).operations
    if animal == "cat":
        body = models.Cat(name="Whiskers", meow=True)
        wire = {property_name: tags[0], "name": "Whiskers", "meow": True}
    else:
        body = models.Dog(name="Rex", bark=False)
        wire = {property_name: tags[1], "name": "Rex", "bark": False}
    result = getattr(operations, f"get_{animal}")()
    assert type(result) is type(body)
    assert isinstance(result, models.PetBase)
    assert result.as_dict() == wire
    original = body.as_dict()
    assert getattr(operations, f"put_{animal}")(body) is None
    assert body.as_dict() == original


def test_recursive(client):
    dog = recursive.Dog(name="Rex", bark=False)
    body = recursive.Cat(
        name="Whiskers",
        meow=True,
        friend=dog,
        friends=[recursive.Cat(name="Kitten", meow=False)],
        lookup={"best": dog},
    )
    result = client.recursive.get()
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
    assert client.recursive.put(body) is None
    assert body.as_dict() == original
    assert dog.as_dict() == original_dog


def test_transitive_inheritance():
    assert issubclass(explicit.Cat, explicit.Mammal)
    assert issubclass(explicit.Mammal, explicit.PetBase)
