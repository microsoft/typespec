# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from types import SimpleNamespace

import pytest
from jinja2 import Environment, PackageLoader


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


@pytest.fixture
def serializer():
    env = Environment(loader=PackageLoader("pygen.codegen", "templates"))
    source = env.get_template("serialization.py.jinja2").render(
        code_model=SimpleNamespace(license_header="", core_library="corehttp")
    )
    namespace = {}
    exec(compile(source, "<serialization>", "exec"), namespace)
    return namespace["Serializer"]()


def test_query_model_quotes_components_and_preserves_falsy_values(serializer):
    result = serializer.query_model(
        "filter",
        {"wire,name": "a,b & c", "enabled": False, "count": 0, "empty": "", "omitted": None},
    )
    assert result == {"wire%2Cname": "a%2Cb%20%26%20c", "enabled": "false", "count": "0", "empty": ""}


def test_query_model_skip_url_encoding(serializer):
    assert serializer.query_model("filter", {"wire,name": "a,b"}, skip_quote=True) == {"wire,name": "a,b"}


def test_query_model_rejects_missing_required_model(serializer):
    with pytest.raises(ValueError, match="filter"):
        serializer.query_model("filter", None)
