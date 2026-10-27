# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Specification strings must remain literal data in generated Python."""

import ast
import textwrap
from types import SimpleNamespace
from typing import Literal, Optional, get_args

import pytest
from jinja2 import Environment, PackageLoader

from pygen import OptionsDict
from pygen.codegen.models import (
    BodyParameter,
    CodeModel,
    Operation,
    Parameter,
    ParameterList,
    RequestBuilder,
    Response,
    build_type,
)
from pygen.codegen.models.parameter_list import RequestBuilderParameterList
from pygen.codegen.models.primitive_types import StringType
from pygen.codegen.serializers.enum_serializer import EnumSerializer
from pygen.codegen.serializers.builder_serializer import OperationSerializer, _get_polymorphic_subtype_template
from pygen.codegen.serializers.model_serializer import DpgModelSerializer
from pygen.codegen.serializers.types_serializer import TypesSerializer
from pygen.codegen.serializers.utils import json_dumps_template

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
    "before # after",
    'triple """ quotes',
    "a long discriminator value " * 8,
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
@pytest.mark.parametrize("async_mode", [False, True])
def test_complete_operation_preserves_parameter_defaults(code_model, env, value, async_mode):
    parameter = Parameter(
        {
            "wireName": "value",
            "clientName": "value",
            "location": "query",
            "implementation": "Method",
            "optional": True,
            "clientDefaultValue": value,
            "description": "Example value.",
        },
        code_model,
        type=StringType({"type": "string"}, code_model),
    )
    client = code_model.clients[0]
    yaml_data = {
        "url": "/example",
        "method": "GET",
        "groupName": "",
        "isOverload": False,
        "apiVersions": [],
        "description": "Example operation.",
    }
    operation = Operation(
        yaml_data,
        code_model,
        client,
        "example",
        RequestBuilder(
            yaml_data,
            code_model,
            client,
            "build_example_request",
            RequestBuilderParameterList({}, code_model, parameters=[]),
        ),
        ParameterList({}, code_model, parameters=[parameter]),
        responses=[Response({"statusCodes": [204]}, code_model)],
        exceptions=[],
    )
    serializer = OperationSerializer(code_model, async_mode=async_mode, client_namespace="sample")
    source = env.get_template("operation.py.jinja2").render(operation=operation, operation_serializer=serializer)
    function = ast.parse(source).body[0]
    assert isinstance(function, ast.AsyncFunctionDef if async_mode else ast.FunctionDef)
    defaults = {argument.arg: default for argument, default in zip(function.args.kwonlyargs, function.args.kw_defaults)}
    assert ast.literal_eval(defaults["value"]) == value
    documentation = " ".join(ast.get_docstring(function).split())
    assert f"Default value is {repr(value)}." in documentation


@pytest.mark.parametrize("value", VALUES)
@pytest.mark.parametrize("models_mode", ["dpg", "typeddict"])
def test_complete_model_docstrings_preserve_literals(code_model, env, value, models_mode):
    code_model.options["models-mode"] = models_mode
    model = build_type(
        {
            "type": "model",
            "base": models_mode,
            "name": "Example",
            "snakeCaseName": "example",
            "properties": [
                {
                    "wireName": "value",
                    "clientName": "value",
                    "optional": False,
                    "type": {"type": "constant", "value": value, "valueType": {"type": "string"}},
                }
            ],
        },
        code_model,
    )
    serializer_type = DpgModelSerializer if models_mode == "dpg" else TypesSerializer
    source = serializer_type(code_model, env, models=[model]).serialize()
    module = ast.parse(source)
    declaration = next(node for node in module.body if isinstance(node, ast.ClassDef))
    documentation = " ".join(ast.get_docstring(declaration).split())
    assert repr(value) in documentation
    if models_mode == "typeddict":
        assert f"Literal[{repr(value)}]" in documentation


@pytest.mark.parametrize("wire_name", [name for name in VALUES if name])
def test_complete_polymorphic_examples_preserve_wire_names(code_model, env, wire_name):
    code_model.options["models-mode"] = "none"
    base = build_type(
        {
            "type": "model",
            "base": "json",
            "name": "Base",
            "snakeCaseName": "base",
            "properties": [
                {
                    "wireName": wire_name,
                    "clientName": "kind",
                    "optional": False,
                    "isDiscriminator": True,
                    "type": {"type": "string"},
                }
            ],
        },
        code_model,
    )
    child = build_type(
        {
            "type": "model",
            "base": "json",
            "name": "Child",
            "snakeCaseName": "child",
            "discriminatorValue": "child",
            "properties": [
                {
                    "wireName": wire_name,
                    "clientName": "kind",
                    "optional": False,
                    "isDiscriminator": True,
                    "type": {"type": "constant", "value": "child", "valueType": {"type": "string"}},
                }
            ],
        },
        code_model,
    )
    child.parents = [base]
    base.discriminated_subtypes = {"child": child}
    client = code_model.clients[0]
    yaml_data = {
        "url": "/example",
        "method": "POST",
        "groupName": "",
        "isOverload": False,
        "apiVersions": [],
        "description": "Example operation.",
    }
    body = BodyParameter(
        {
            "wireName": "body",
            "clientName": "body",
            "location": "body",
            "optional": False,
            "contentTypes": ["application/json"],
            "defaultContentType": "application/json",
            "description": "Example body.",
        },
        code_model,
        type=base,
    )
    operation = Operation(
        yaml_data,
        code_model,
        client,
        "example",
        RequestBuilder(
            yaml_data,
            code_model,
            client,
            "build_example_request",
            RequestBuilderParameterList({}, code_model, parameters=[]),
        ),
        ParameterList({}, code_model, parameters=[], body_parameter=body),
        responses=[Response({"statusCodes": [200], "defaultContentType": "application/json"}, code_model, type=base)],
        exceptions=[],
    )
    serializer = OperationSerializer(code_model, async_mode=False, client_namespace="sample")
    template = "\n".join(serializer.example_template(operation))
    for direction in ("input", "response"):
        assert (
            f"# The {direction} is polymorphic. The following are possible polymorphic "
            f"{direction}s based off discriminator {wire_name!r}:"
        ) in template.splitlines()
    ast.parse(template)
    documentation = env.from_string(
        '{% import "operation_tools.jinja2" as tools %}{{ tools.description(builder, serializer) }}'
    ).render(builder=operation, serializer=serializer)
    function = ast.parse("def example():\n" + textwrap.indent(documentation.strip(), "    ")).body[0]
    example = textwrap.dedent(ast.get_docstring(function).split(".. code-block:: python\n", 1)[1])
    assignments = [node for node in ast.parse(example).body if isinstance(node, ast.Assign)]
    assert len(assignments) == 3
    for assignment in assignments[::2]:
        assert ast.literal_eval(assignment.value) == {wire_name: "child"}
    assert example.count(f"based off discriminator {wire_name!r}:") == 2


def test_json_template_preserves_nested_python_expressions():
    representation = {
        '"nested"': [
            {
                '"text"': repr("str"),
                '"count"': "0",
                '"flag"': "True",
                '"data"': "None",
            }
        ],
        '"model"': "models.Example()",
    }
    template = json_dumps_template(representation)
    expression = ast.parse(template, mode="eval").body
    assert ast.literal_eval(expression.values[0]) == [{"text": "str", "count": 0, "flag": True, "data": None}]
    assert ast.unparse(expression.values[1]) == "models.Example()"


@pytest.mark.parametrize(
    "value, wire_name",
    [(value, "kind") for value in VALUES] + [("child", wire_name) for wire_name in VALUES if wire_name],
)
def test_discriminator_generation_preserves_values(code_model, env, value, wire_name):
    model = build_type(
        {
            "type": "model",
            "base": "dpg",
            "name": "Child",
            "snakeCaseName": "child",
            "discriminatorValue": value,
            "properties": [
                {
                    "wireName": wire_name,
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
        assert {ast.literal_eval(k): ast.literal_eval(v) for k, v in representation.items()} == {wire_name: value}
        template = json_dumps_template(representation)
        assert ast.literal_eval(template) == {wire_name: value}
        model.parents[0].discriminated_subtypes = {value: model}
        model.parents[0].parents = []
        model.parents[0].snake_case_name = "base"
        rendered = "\n".join(_get_polymorphic_subtype_template(model))
        assignments = ast.parse(rendered).body
        assert len(assignments) == 1
        assert ast.literal_eval(assignments[0].value) == {wire_name: value}
        documentation = env.from_string(
            '{% import "operation_tools.jinja2" as tools %}{{ tools.description(builder, serializer) }}'
        ).render(
            builder=SimpleNamespace(),
            serializer=SimpleNamespace(
                example_template=lambda builder: rendered.splitlines(),
                param_description_and_response_docstring=lambda builder: [],
                description_and_summary=lambda builder: ["Example operation."],
            ),
        )
        function = ast.parse("def operation():\n" + textwrap.indent(documentation.strip(), "    ")).body[0]
        docstring = ast.get_docstring(function)
        example = textwrap.dedent(docstring.split(".. code-block:: python\n", 1)[1])
        documented_assignments = ast.parse(example).body
        assert len(documented_assignments) == 1
        assert ast.literal_eval(documented_assignments[0].value) == {wire_name: value}
    calls = []

    def marker():
        calls.append(True)
        return "unexpected"

    source = "\n".join(
        [
            "class Base(_Model):",
            "    __mapping__ = {}",
            "    " + serializer.declare_property(prop),
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
        assert instance.as_dict() == {wire_name: value}
        if value:
            selected = namespace["Base"]._deserialize({wire_name: value}, [])
            assert isinstance(selected, child)
            assert selected.as_dict() == {wire_name: value}
    assert calls == []


@pytest.mark.parametrize("wire_name", [wire_name for wire_name in VALUES if wire_name])
@pytest.mark.parametrize("optional", [False, True])
def test_property_wire_names_are_literals(code_model, env, wire_name, optional):
    model = build_type(
        {
            "type": "model",
            "base": "dpg",
            "name": "Example",
            "snakeCaseName": "example",
            "properties": [
                {
                    "wireName": "required",
                    "clientName": "required",
                    "optional": False,
                    "type": {"type": "string"},
                },
                {
                    "wireName": wire_name,
                    "clientName": "value",
                    "optional": optional,
                    "type": {"type": "string"},
                },
            ],
        },
        code_model,
    )
    template = json_dumps_template(model.get_json_template_representation())
    assert ast.literal_eval(template) == {"required": "str", wire_name: "str"}
    if optional:
        assert list(ast.literal_eval(template)) == ["required", wire_name]
    serializer = DpgModelSerializer(code_model, env, models=[model])
    source = "\n".join(
        [serializer.declare_model(model), *["    " + serializer.declare_property(prop) for prop in model.properties]]
    )
    runtime = env.get_template("model_base.py.jinja2").render(code_model=code_model)
    namespace = {"__name__": "wire_name_test"}
    exec(compile(runtime, "<model_base>", "exec"), namespace)
    namespace.update(_Model=namespace["Model"], Optional=Optional)
    exec(compile(source, "<models>", "exec"), namespace)
    instance = namespace["Example"](required="first", value="example")
    assert instance.as_dict() == {"required": "first", wire_name: "example"}
    assert namespace["Example"]({"required": "first", wire_name: "example"}).value == "example"
    typed_model = build_type({**model.yaml_data, "base": "typeddict"}, code_model)
    types_source = TypesSerializer(code_model, env, models=[typed_model]).serialize()
    types_namespace = {"__name__": "wire_name_types_test"}
    exec(compile(types_source, "<types>", "exec"), types_namespace)
    assert set(types_namespace["Example"].__annotations__) == {"required", wire_name}


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
