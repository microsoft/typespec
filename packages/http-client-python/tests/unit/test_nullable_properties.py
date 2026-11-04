# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import ast

from jinja2 import Environment, PackageLoader
import pytest

from pygen.codegen.models import CodeModel, DPGModelType, build_type
from pygen.codegen.models.model_type import TypedDictModelType
from pygen.codegen.models.property import Property
from pygen.codegen.serializers.model_serializer import DpgModelSerializer
from pygen.codegen.serializers.types_serializer import TypesSerializer


def _render_model(optional: bool, nullable: bool) -> tuple[ast.Module, ast.Module]:
    code_model = CodeModel(
        {
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
            "namespace": "sample",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": "dpg",
            "flavor": "unbranded",
            "client-side-validation": False,
            "keep-setup-py": False,
            "basic-setup-py": False,
            "no-namespace-folders": False,
            "generation-subdir": None,
        },
    )
    prop = Property(
        yaml_data={
            "wireName": "value",
            "clientName": "value",
            "optional": optional,
            "nullable": nullable,
        },
        code_model=code_model,
        type=build_type({"type": "string"}, code_model),
    )
    model_data = {"name": "Payload", "type": "model", "snakeCaseName": "payload", "usage": 2}
    model = DPGModelType(yaml_data=model_data, code_model=code_model, properties=[prop])
    input_model = TypedDictModelType(yaml_data=model_data, code_model=code_model, properties=[prop])
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"), trim_blocks=True, lstrip_blocks=True)
    model_source = DpgModelSerializer(code_model=code_model, env=env, models=[model]).serialize()
    input_source = TypesSerializer(code_model=code_model, env=env, models=[input_model]).serialize()
    return ast.parse(model_source), ast.parse(input_source)


@pytest.mark.parametrize(
    "optional,nullable,model_annotation,input_annotation",
    [
        (False, False, "str", "Required[str]"),
        (False, True, "Optional[str]", "Required[Optional[str]]"),
        (True, False, "Optional[str]", "str"),
        (True, True, "Optional[str]", "Optional[str]"),
    ],
)
def test_property_nullability_preserves_requiredness(optional, nullable, model_annotation, input_annotation):
    model_module, input_module = _render_model(optional, nullable)
    model = next(node for node in model_module.body if isinstance(node, ast.ClassDef))
    field = next(node for node in model.body if isinstance(node, ast.AnnAssign))
    assert ast.unparse(field.annotation) == model_annotation

    constructor = next(node for node in model.body if isinstance(node, ast.FunctionDef) and node.args.kwonlyargs)
    assert ast.unparse(constructor.args.kwonlyargs[0].annotation) == model_annotation
    default = constructor.args.kw_defaults[0]
    if optional:
        assert isinstance(default, ast.Constant) and default.value is None
    else:
        assert default is None

    if model_annotation == "Optional[str]":
        assert any(
            isinstance(node, ast.ImportFrom)
            and node.module == "typing"
            and any(alias.name == "Optional" for alias in node.names)
            for node in model_module.body
        )

    input_model = next(node for node in input_module.body if isinstance(node, ast.ClassDef))
    input_field = next(node for node in input_model.body if isinstance(node, ast.AnnAssign))
    assert ast.unparse(input_field.annotation) == input_annotation
