# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Specification strings must remain literal data in generated Python."""

import ast
from types import SimpleNamespace
from typing import Literal, get_args

import pytest
from jinja2 import Environment, PackageLoader

from pygen import OptionsDict
from pygen.codegen.models import CodeModel, build_type
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.serializers.enum_serializer import EnumSerializer
from pygen.codegen.serializers.model_serializer import DpgModelSerializer

VALUES = [
    "ordinary",
    "",
    "'",
    '"',
    "Both 'single' and \"double\" quotes",
    r"C:\new\test\\",
    "first\nsecond\r\t\x00\x1f",
    "\u96ea\U0001f600",
    'prefix" + marker() + "suffix',
    "prefix' + marker() + 'suffix",
]


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


@pytest.fixture
def code_model():
    return CodeModel(
        {
            "namespace": "sample",
            "clients": [
                {
                    "name": "client",
                    "namespace": "sample",
                    "moduleName": "sample",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
        },
        OptionsDict({"models-mode": "dpg", "flavor": "unbranded", "tsp_file": True}),
    )


@pytest.fixture
def env():
    return Environment(loader=PackageLoader("pygen.codegen", "templates"), trim_blocks=True, lstrip_blocks=True)


@pytest.mark.parametrize("value", VALUES)
def test_string_declarations_are_literals(code_model, value):
    declaration = StringType({"type": "string"}, code_model).get_declaration(value)
    assert ast.literal_eval(declaration) == value


@pytest.mark.parametrize("value", VALUES)
def test_discriminator_generation_preserves_values(code_model, env, value):
    model = build_type(
        {
            "type": "model",
            "base": "dpg",
            "name": "Child",
            "snakeCaseName": "child",
            "discriminatorValue": value,
            "properties": [
                {
                    "wireName": "kind",
                    "clientName": "kind",
                    "optional": False,
                    "isDiscriminator": True,
                    "type": {"type": "constant", "value": value, "valueType": {"type": "string"}},
                }
            ],
        },
        code_model,
    )
    serializer = DpgModelSerializer(code_model, env, models=[model])
    model.parents = [SimpleNamespace(name="Base", properties=[])]
    prop = model.properties[0]
    if value:
        representation = model.get_json_template_representation()
        assert {ast.literal_eval(k): ast.literal_eval(v) for k, v in representation.items()} == {"kind": value}
    calls = []

    def marker():
        calls.append(True)
        return "unexpected"

    source = "\n".join(
        [
            "class Base(_Model):",
            "    __mapping__ = {}",
            '    kind: str = rest_discriminator(name="kind")',
            serializer.declare_model(model),
            "    " + serializer.declare_property(prop),
            "    def __init__(self, *args, **kwargs):",
            *["        " + line for line in serializer.super_call(model)],
        ]
    )
    module = ast.parse(source)
    annotation = module.body[1].body[0].annotation
    assert ast.literal_eval(annotation.slice) == value
    if value:
        assert ast.literal_eval(module.body[1].keywords[0].value) == value

    runtime = env.get_template("model_base.py.jinja2").render(code_model=code_model)
    namespace = {"__name__": "string_literal_test"}
    exec(compile(runtime, "<model_base>", "exec"), namespace)
    namespace.update(
        _Model=namespace["Model"],
        Literal=Literal,
        marker=marker,
    )
    exec(compile(source, "<models>", "exec"), namespace)
    child = namespace["Child"]
    assert get_args(child.__annotations__["kind"]) == (value,)
    for _ in range(2):
        instance = child()
        assert instance.kind == value
        assert instance.as_dict() == {"kind": value}
        if value:
            selected = namespace["Base"]._deserialize({"kind": value}, [])
            assert isinstance(selected, child)
            assert selected.as_dict() == {"kind": value}
    assert calls == []


@pytest.mark.parametrize("value", VALUES[0:1] + VALUES[2:])
def test_discriminator_initializer_is_literal(value):
    model = SimpleNamespace(discriminator_value=value)
    prop = SimpleNamespace(client_name="kind")
    statement = DpgModelSerializer.initialize_discriminator_property(model, prop)
    assignment = ast.parse(statement).body[0]
    assert ast.literal_eval(assignment.value) == value


@pytest.mark.parametrize("value", VALUES)
def test_enum_values_are_literals(code_model, env, value):
    enum_yaml = {
        "type": "enum",
        "name": "Kind",
        "valueType": {"type": "string"},
        "values": [],
    }
    enum = build_type(enum_yaml, code_model)
    enum.values.append(
        build_type(
            {
                "type": "enumvalue",
                "name": "VALUE",
                "value": value,
                "enumType": enum_yaml,
                "valueType": {"type": "string"},
            },
            code_model,
        )
    )
    source = EnumSerializer(code_model, env, enums=[enum]).serialize()
    assignments = [node for node in ast.walk(ast.parse(source)) if isinstance(node, ast.Assign)]
    assignment = next(node for node in assignments if any(getattr(t, "id", "") == "VALUE" for t in node.targets))
    assert ast.literal_eval(assignment.value) == value
