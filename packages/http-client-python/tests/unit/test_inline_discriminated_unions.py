# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Union-local dispatch must not turn the declared base into a polymorphic model."""
import json
import importlib
import sys
from types import ModuleType, SimpleNamespace
from typing import Annotated, Optional, Union

import pytest
from jinja2 import Environment, PackageLoader
from pygen import OptionsDict
from pygen.codegen.models import CodeModel
from pygen.codegen.serializers import JinjaSerializer
from pygen.codegen.serializers.builder_serializer import OperationSerializer


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


@pytest.fixture(params=["azure", "unbranded"])
def runtime(request, monkeypatch):
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"))
    code = env.get_template("model_base.py.jinja2").render(
        code_model=SimpleNamespace(
            license_header="",
            core_library="azure.core" if request.param == "azure" else "corehttp",
            is_azure_flavor=request.param == "azure",
            has_external_type=False,
            has_padded_model_property=False,
        )
    )
    module = ModuleType("inline_union_runtime")
    monkeypatch.setitem(sys.modules, module.__name__, module)
    exec(compile(code, "<generated model_base>", "exec"), module.__dict__)
    return module


@pytest.fixture
def pets(runtime):
    class PetBase(runtime.Model):
        kind: str = runtime.rest_field()
        name: str = runtime.rest_field()

    class Cat(PetBase):
        meows: bool = runtime.rest_field()

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.kind = "cat"

    class Dog(PetBase):
        barks: bool = runtime.rest_field()

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.kind = "dog"

    pet = Annotated[Union[Cat, Dog], runtime._DiscriminatedUnion("kind", {"cat": Cat, "dog": Dog})]
    return SimpleNamespace(base=PetBase, cat=Cat, dog=Dog, union=pet)


@pytest.mark.parametrize("tag", ["cat", "dog"])
def test_dispatch_and_inline_serialization(runtime, pets, tag):
    wire = {"kind": tag, "name": "Whiskers", "meows" if tag == "cat" else "barks": True}
    model = runtime._deserialize(pets.union, wire)
    assert type(model) is getattr(pets, tag)
    assert isinstance(model, pets.base)
    assert json.loads(json.dumps(model, cls=runtime.SdkJSONEncoder)) == wire
    assert type(runtime._deserialize(pets.base, wire)) is pets.base
    assert not hasattr(pets.base, "__mapping__")


@pytest.mark.parametrize("wire", [{}, {"kind": "lizard"}, {"kind": []}, "cat"])
def test_closed_union_rejects_missing_unknown_or_invalid_tags(runtime, pets, wire):
    with pytest.raises(runtime.DeserializationError):
        runtime._deserialize(pets.union, wire)


def test_containers_and_nullable(runtime, pets):
    dog = {"kind": "dog", "name": "Fido", "barks": True}
    assert type(runtime._deserialize(list[pets.union], [dog])[0]) is pets.dog
    assert type(runtime._deserialize(dict[str, pets.union], {"pet": dog})["pet"]) is pets.dog
    assert type(runtime._deserialize(Optional[pets.union], dog)) is pets.dog
    assert runtime._deserialize(Optional[pets.union], None) is None


def test_model_properties(runtime, pets):
    pet_type = pets.union

    class Holder(runtime.Model):
        pet: pet_type = runtime.rest_field()
        pets: list[pet_type] = runtime.rest_field()
        by_name: dict[str, pet_type] = runtime.rest_field()

    wire = {"kind": "dog", "name": "Fido", "barks": True}
    holder = Holder(pet=wire, pets=[wire], by_name={"fido": wire})
    assert type(holder.pet) is pets.dog
    assert type(holder.pets[0]) is pets.dog
    assert type(holder.by_name["fido"]) is pets.dog
    assert json.loads(json.dumps(holder, cls=runtime.SdkJSONEncoder)) == {
        "pet": wire,
        "pets": [wire],
        "by_name": {"fido": wire},
    }


def test_configured_discriminator_does_not_change_untagged_union(runtime, pets):
    renamed = Annotated[
        Union[pets.cat, pets.dog],
        runtime._DiscriminatedUnion("petType", {"feline": pets.cat, "canine": pets.dog}),
    ]
    assert type(runtime._deserialize(renamed, {"petType": "canine"})) is pets.dog
    with pytest.raises(runtime.DeserializationError):
        runtime._deserialize(renamed, {"kind": "dog"})
    assert type(runtime._deserialize(Union[pets.cat, pets.dog], {"kind": "dog"})) is pets.cat


def test_legacy_discriminator_hierarchy_is_unchanged(runtime):
    class Animal(runtime.Model):
        __mapping__ = {}
        kind: str = runtime.rest_discriminator(name="kind")

    class Dog(Animal, discriminator="dog"):
        pass

    Animal()
    assert type(runtime._deserialize(Animal, {"kind": "dog"})) is Dog
    assert type(runtime._deserialize(Animal, {"kind": "unknown"})) is Animal


@pytest.fixture(params=["inline_pets", "inline_pets.nested"])
def generated_sdk(tmp_path, monkeypatch, request):
    def prop(name, type_data):
        return {"clientName": name, "wireName": name, "optional": False, "type": type_data}

    def model(name, properties, parents=None):
        return {
            "type": "model",
            "base": "dpg",
            "name": name,
            "snakeCaseName": name.lower(),
            "clientNamespace": "inline_pets",
            "properties": properties,
            "parents": parents or [],
            "usage": 6,
        }

    string = {"type": "string"}
    base = model("PetBase", [prop("kind", string), prop("name", string)])
    cat = model(
        "Cat",
        [
            prop("kind", {"type": "constant", "value": "cat", "valueType": string}),
            prop("meows", {"type": "boolean"}),
        ],
        [base],
    )
    dog = model(
        "Dog",
        [
            prop("kind", {"type": "constant", "value": "dog", "valueType": string}),
            prop("barks", {"type": "boolean"}),
        ],
        [base],
    )
    pet = {
        "type": "combined",
        "name": "Pet",
        "types": [cat, dog],
        "clientNamespace": "inline_pets",
        "baseType": base,
        "discriminator": {"propertyName": "kind", "variants": {"cat": cat, "dog": dog}},
    }
    cat["properties"].append({**prop("friend", pet), "optional": True})
    plain_pet = {
        "type": "combined",
        "name": "PlainPet",
        "types": [cat, dog],
        "clientNamespace": "inline_pets",
    }
    holder = model(
        "Holder",
        [
            prop("pet", pet),
            prop("pets", {"type": "list", "elementType": pet}),
            prop("by_name", {"type": "dict", "elementType": pet}),
            {**prop("plain_pet", plain_pet), "optional": True},
        ],
    )
    holder["clientNamespace"] = request.param
    code_model = CodeModel(
        {"namespace": "inline_pets", "clients": [], "types": [base, cat, dog, pet, holder]},
        options=OptionsDict(
            {
                "models-mode": "dpg",
                "flavor": "unbranded",
                "tsp_file": True,
                "generate-packaging-files": False,
                "package-name": "inline-pets",
            }
        ),
    )
    JinjaSerializer(code_model, output_folder=tmp_path).serialize()
    monkeypatch.syspath_prepend(str(tmp_path))
    models = importlib.import_module("inline_pets.models")
    unions = importlib.import_module("inline_pets._unions")
    runtime = importlib.import_module("inline_pets._utils.model_base")
    holder_type = importlib.import_module(request.param + ".models").Holder
    yield SimpleNamespace(models=models, holder=holder_type, unions=unions, runtime=runtime, code_model=code_model)
    for name in list(sys.modules):
        if name == "inline_pets" or name.startswith("inline_pets."):
            sys.modules.pop(name)


def test_generated_alias_models_and_property_imports(generated_sdk):
    sdk = generated_sdk
    dog = {"kind": "dog", "name": "Fido", "barks": True}
    model = sdk.runtime._deserialize(sdk.unions.Pet, dog)
    assert type(model) is sdk.models.Dog
    assert isinstance(model, sdk.models.PetBase)
    holder = sdk.holder(pet=dog, pets=[dog], by_name={"fido": dog})
    assert type(holder.pet) is sdk.models.Dog
    assert type(holder.pets[0]) is sdk.models.Dog
    assert type(holder.by_name["fido"]) is sdk.models.Dog
    assert sdk.models.Dog(name="Fido", barks=True).as_dict() == dog
    cat = sdk.runtime._deserialize(
        sdk.unions.Pet,
        {
            "kind": "cat",
            "name": "Whiskers",
            "meows": True,
            "friend": dog,
        },
    )
    assert type(cat.friend) is sdk.models.Dog
    assert type(sdk.runtime._deserialize(sdk.models.PetBase, dog)) is sdk.models.PetBase
    assert type(sdk.holder(plain_pet=dog).plain_pet) is dict


@pytest.mark.parametrize("async_mode", [False, True])
def test_generated_operation_response_dispatch(generated_sdk, async_mode):
    sdk = generated_sdk
    union_type = next(t for t in sdk.code_model.named_unions if t.name == "Pet")
    serializer = OperationSerializer(sdk.code_model, async_mode=async_mode, client_namespace="inline_pets")
    response = SimpleNamespace(
        type=union_type,
        default_content_type="application/json",
        result_property="",
    )
    builder = SimpleNamespace(has_stream_response=False, expose_stream_keyword=False)
    lines = serializer.response_deserialization(builder, response)
    namespace = {
        "_unions": sdk.unions,
        "_deserialize": sdk.runtime._deserialize,
        "response": SimpleNamespace(json=lambda: {"kind": "dog", "name": "Fido", "barks": True}),
    }
    exec("\n".join(lines), namespace)
    assert type(namespace["deserialized"]) is sdk.models.Dog
    body = SimpleNamespace(
        type=union_type,
        is_form_data=False,
        default_content_type="application/json",
        client_name="pet",
        optional=False,
    )
    request_builder = SimpleNamespace(
        parameters=SimpleNamespace(body_parameter=SimpleNamespace(client_name="content")),
    )
    builder = SimpleNamespace(
        parameters=SimpleNamespace(body_parameter=body),
        request_builder=request_builder,
    )
    lines = serializer._serialize_body_parameter(builder)
    namespace = {
        "json": json,
        "SdkJSONEncoder": sdk.runtime.SdkJSONEncoder,
        "pet": sdk.models.Dog(name="Fido", barks=True),
    }
    exec("\n".join(lines), namespace)
    assert json.loads(namespace["_content"]) == {"kind": "dog", "name": "Fido", "barks": True}
