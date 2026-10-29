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
from pygen.codegen.models.utils import python_string_literal
from pygen.codegen.serializers.enum_serializer import EnumSerializer
from pygen.codegen.serializers.builder_serializer import OperationSerializer, _get_polymorphic_subtype_template
from pygen.codegen.serializers.model_serializer import DpgModelSerializer
from pygen.codegen.serializers.general_serializer import GeneralSerializer
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

PROJECTS_TOOLS_DESCRIPTION = (
    "A list of tool definitions that the model should be allowed to call.\n"
    "  For the Responses API, the list of tool definitions might look like:\n\n"
    ".. code-block:: json\n\n"
    "   [\n"
    '     { "type": "function", "name": "get_weather" },\n'
    '     { "type": "mcp", "server_label": "deepwiki" },\n'
    '     { "type": "image_generation" }\n'
    "   ]"
)


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


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize(
    "description, expected",
    [
        pytest.param(
            "Updates the agent by adding a new version if there are any changes to the agent definition.\n"
            "If no changes, returns the existing agent version.",
            "Updates the agent by adding a new version if there are any changes to the agent definition. If\n"
            "no changes, returns the existing agent version.",
            id="agent-update-multiline-prose",
        ),
        pytest.param(
            "New event types may be added in the future. Clients should gracefully\n"
            "ignore unrecognized event types.\n\n"
            "Wire format:",
            "New event types may be added in the future. Clients should gracefully\n"
            "ignore unrecognized event types.\n\n"
            "Wire format:",
            id="session-log-paragraphs",
        ),
        pytest.param(
            'Each SSE frame contains:\n\n* `event`: always `"log"`\n* `data`: a plain-text log line.',
            'Each SSE frame contains:\n\n* `event`: always `"log"`\n* `data`: a plain-text log line.',
            id="session-log-bullets",
        ),
        pytest.param(
            PROJECTS_TOOLS_DESCRIPTION,
            "A list of tool definitions that the model should be allowed to call. For the Responses API, the\n"
            "list of tool definitions might look like:\n\n"
            ".. code-block:: json\n\n"
            "   [\n"
            '     { "type": "function", "name": "get_weather" },\n'
            '     { "type": "mcp", "server_label": "deepwiki" },\n'
            '     { "type": "image_generation" }\n'
            "   ]",
            id="allowed-tools-json-block",
        ),
    ],
)
def test_projects_operation_preserves_description_layout(code_model, env, async_mode, description, expected):
    # #9466 and Azure/azure-sdk-for-python#44885 cover these Projects description layouts.
    code_model.options["flavor"] = "azure"
    client = code_model.clients[0]
    yaml_data = {
        "url": "/example",
        "method": "GET",
        "groupName": "",
        "isOverload": False,
        "apiVersions": [],
        "description": description,
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
        ParameterList({}, code_model, parameters=[]),
        responses=[Response({"statusCodes": [204]}, code_model)],
        exceptions=[],
    )
    serializer = OperationSerializer(code_model, async_mode=async_mode, client_namespace="sample")

    source = env.get_template("operation.py.jinja2").render(operation=operation, operation_serializer=serializer)

    function = ast.parse(source).body[0]
    documentation = ast.get_docstring(function)
    assert documentation.split(":return:", 1)[0].strip() == expected


def test_projects_model_preserves_allowed_tools_json_block(code_model, env):
    code_model.options["flavor"] = "azure"
    model = build_type(
        {
            "type": "model",
            "base": "dpg",
            "name": "ToolChoiceAllowed",
            "snakeCaseName": "tool_choice_allowed",
            "properties": [
                {
                    "wireName": "tools",
                    "clientName": "tools",
                    "optional": False,
                    "description": PROJECTS_TOOLS_DESCRIPTION,
                    "type": {"type": "list", "elementType": {"type": "dict", "elementType": {"type": "any-object"}}},
                }
            ],
        },
        code_model,
    )

    source = DpgModelSerializer(code_model, env, models=[model]).serialize()

    declaration = next(node for node in ast.parse(source).body if isinstance(node, ast.ClassDef))
    documentation = ast.get_docstring(declaration)
    assert ":ivar tools: Required. A list of tool definitions" in documentation
    block = documentation.split(".. code-block:: json\n", 1)[1].split(":vartype tools:", 1)[0]
    assert ast.literal_eval(textwrap.dedent(block).strip()) == [
        {"type": "function", "name": "get_weather"},
        {"type": "mcp", "server_label": "deepwiki"},
        {"type": "image_generation"},
    ]


@pytest.mark.parametrize("value", VALUES)
def test_string_declarations_are_literals(code_model, value):
    declaration = StringType({"type": "string"}, code_model).get_declaration(value)
    assert ast.literal_eval(declaration) == value


@pytest.mark.parametrize(
    "value, expected",
    [
        ("ordinary", '"ordinary"'),
        ("application/json", '"application/json"'),
        ("don't", '"don\'t"'),
        ("", '""'),
        ("\u96ea\U0001f600", '"\u96ea\U0001f600"'),
        ('"', "'\"'"),
    ],
)
def test_string_declarations_preserve_quote_style(code_model, value, expected):
    assert StringType({"type": "string"}, code_model).get_declaration(value) == expected


@pytest.mark.parametrize("value", VALUES + ["\\'", '\\\\"', "\ud800", "\udfff"])
@pytest.mark.parametrize("quote", ['"', "'"])
def test_python_string_literal_preserves_value(value, quote):
    source = python_string_literal(value, quote=quote)
    assert ast.literal_eval(source) == value
    source.encode("utf-8")


def test_docstring_wrapping_preserves_ordinary_quotes(env):
    description = 'Known values are: "function", "file_search", "computer", and "web_search". ' * 3
    template = env.from_string('{% import "operation_tools.jinja2" as tools %}{{ tools[macro](description, "\\n ") }}')
    assert template.render(macro="wrap_docstring", description=description) == template.render(
        macro="wrap_string", description=description
    )


def test_model_declarations_preserve_quote_style(code_model, env):
    model = build_type(
        {
            "type": "model",
            "base": "dpg",
            "name": "Child",
            "snakeCaseName": "child",
            "discriminatorValue": "child",
            "properties": [
                {
                    "wireName": "@kind",
                    "clientName": "kind",
                    "optional": False,
                    "isDiscriminator": True,
                    "type": {"type": "constant", "value": "child", "valueType": {"type": "string"}},
                }
            ],
        },
        code_model,
    )
    serializer = DpgModelSerializer(code_model, env, models=[model])
    model.parents = [
        SimpleNamespace(
            name="Base", properties=[], discriminated_subtypes={"child": model}, parents=[], snake_case_name="base"
        )
    ]
    assert "class Child(Base, discriminator='child'):" in serializer.declare_model(model)
    assert serializer.declare_property(model.properties[0]).startswith(
        'kind: Literal["child"] = rest_discriminator(name="@kind")'
    )
    assert serializer.initialize_discriminator_property(model, model.properties[0]) == "self.kind: str  = 'child'"
    assert model.get_json_template_representation() == {'"@kind"': '"child"'}
    assert _get_polymorphic_subtype_template(model)[1] == '# JSON input template for discriminator value "child":'
    typed_model = build_type({**model.yaml_data, "base": "typeddict"}, code_model)
    types_source = TypesSerializer(code_model, env, models=[typed_model]).serialize()
    assert '"@kind": Required[Literal["child"]]' in types_source


@pytest.mark.parametrize("value", VALUES)
@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("file_kind", ["client", "config"])
def test_complete_client_preserves_parameter_defaults(code_model, env, value, async_mode, file_kind):
    string_type = {"type": "string"}
    code_model = CodeModel(
        {
            "namespace": "sample",
            "types": [string_type],
            "clients": [
                {
                    "name": "Client",
                    "namespace": "sample",
                    "moduleName": "sample",
                    "description": "Example client.",
                    "url": "https://example.test",
                    "operationGroups": [],
                    "parameters": [
                        {
                            "wireName": "value",
                            "clientName": "value",
                            "location": "query",
                            "implementation": "Client",
                            "optional": True,
                            "clientDefaultValue": value,
                            "description": "Example value.",
                            "type": string_type,
                        }
                    ],
                }
            ],
        },
        code_model.options,
    )
    serializer = GeneralSerializer(code_model, env, async_mode=async_mode, client_namespace="sample")
    if file_kind == "client":
        source = serializer.serialize_service_client_file(code_model.clients)
    else:
        source = serializer.serialize_config_file(code_model.clients)
    module = ast.parse(source)
    declaration = next(node for node in module.body if isinstance(node, ast.ClassDef))
    documentation = " ".join(ast.get_docstring(declaration).split())
    literal = StringType({"type": "string"}, code_model).get_declaration(value)
    assert f"Default value is {literal}." in documentation


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
    # cspell:ignore kwonlyargs
    defaults = {argument.arg: default for argument, default in zip(function.args.kwonlyargs, function.args.kw_defaults)}
    assert ast.literal_eval(defaults["value"]) == value
    documentation = " ".join(ast.get_docstring(function).split())
    literal = StringType({"type": "string"}, code_model).get_declaration(value)
    assert f"Default value is {literal}." in documentation


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
    literal = StringType({"type": "string"}, code_model).get_declaration(value)
    assert literal in documentation
    if value == "ordinary":
        assert ':ivar value: Required. Default value is "ordinary".' in source
    if models_mode == "typeddict":
        assert f"Literal[{literal}]" in documentation


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
            f"{direction}s based off discriminator {python_string_literal(wire_name)}:"
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
    assert example.count(f"based off discriminator {python_string_literal(wire_name)}:") == 2


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
