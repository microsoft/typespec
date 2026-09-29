# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from jinja2 import Environment, FileSystemLoader


def _render_model_base(flavor):
    templates = Path(__file__).parents[2] / "generator/pygen/codegen/templates"
    env = Environment(loader=FileSystemLoader(templates), trim_blocks=True, lstrip_blocks=True)
    source = env.get_template("model_base.py.jinja2").render(
        code_model=SimpleNamespace(
            license_header="",
            core_library="azure.core" if flavor == "azure" else "corehttp",
            is_azure_flavor=flavor == "azure",
            has_external_type=False,
            has_padded_model_property=False,
        )
    )
    return source, templates


@pytest.fixture(scope="module")
def model_base():
    pytest.importorskip("azure.core.exceptions")
    source, templates = _render_model_base("azure")
    namespace = {"__name__": "test_generated_model_base"}
    exec(compile(source, str(templates / "model_base.py.jinja2"), "exec"), namespace)
    return SimpleNamespace(**namespace)


def test_deserialized_odata_details_as_dict_and_json(model_base):
    from azure.core.exceptions import ODataV4Format

    class ErrorCarrier(model_base.Model):
        details: list[ODataV4Format] = model_base.rest_field()
        readonly: ODataV4Format = model_base.rest_field(visibility=["read"])

    wire_detail = {
        "code": "Child",
        "message": "Invalid value",
        "target": "name",
        "details": [{"code": "Leaf", "message": "Missing name"}],
        "innererror": {"trace": {"id": "123", "optional": None}},
    }
    model = ErrorCarrier({"details": [wire_detail], "readonly": wire_detail, "missing": None})
    assert isinstance(model.details[0], ODataV4Format)
    assert isinstance(model.details[0].details[0], ODataV4Format)
    expected = {"details": [wire_detail], "readonly": wire_detail, "missing": None}

    result = model.as_dict()
    assert result == expected
    assert json.loads(json.dumps(result)) == expected
    assert model.as_dict(exclude_readonly=True) == {"details": [wire_detail], "missing": None}
    assert json.loads(json.dumps(model, cls=model_base.SdkJSONEncoder)) == expected
    assert json.loads(json.dumps(model, cls=model_base.SdkJSONEncoder, exclude_readonly=True)) == {
        "details": [wire_detail],
        "missing": None,
    }


def test_odata_request_serialization_and_optional_fields(model_base):
    from azure.core.exceptions import ODataV4Format

    class ErrorCarrier(model_base.Model):
        error: ODataV4Format = model_base.rest_field()

    wire_error = {"code": "Parent", "message": "Bad request", "details": [{"code": "Child", "message": "Oops"}]}
    error = model_base._deserialize(ODataV4Format, wire_error)
    assert isinstance(error, ODataV4Format)
    expected = {"code": "Parent", "message": "Bad request", "details": [{"code": "Child", "message": "Oops"}]}

    assert json.loads(json.dumps(error, cls=model_base.SdkJSONEncoder)) == expected
    assert model_base._serialize(error) == expected
    assert model_base._serialize({"errors": [error]}) == {"errors": [expected]}
    model = ErrorCarrier(error=error)
    assert isinstance(model.error, ODataV4Format)
    assert model.as_dict() == {"error": expected}
    assert json.loads(json.dumps(model, cls=model_base.SdkJSONEncoder, exclude_readonly=True)) == {"error": expected}


def test_unbranded_model_base_does_not_depend_on_azure():
    source, templates = _render_model_base("unbranded")
    assert "ODataV4Format" not in source
    namespace = {"__name__": "test_unbranded_model_base"}
    exec(compile(source, str(templates / "model_base.py.jinja2"), "exec"), namespace)

    class Carrier(namespace["Model"]):
        value: dict = namespace["rest_field"]()

    value = {"inner": [None, {"message": "plain dict"}]}
    assert Carrier(value=value).as_dict() == {"value": value}
