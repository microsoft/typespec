# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Unit tests for preserving manually customized pyproject.toml fields.

The emitter regenerates pyproject.toml on every emit. Manual edits to fields
the emitter doesn't own (description, classifiers, project URLs) must be
preserved so they are not clobbered (see GitHub issue #10311).
"""
from pygen.codegen.serializers.general_serializer import GeneralSerializer


_ALL_FIELDS = ("authors", "description", "classifiers", "urls")


def _keep_fields(file_content: str, keep_pyproject_fields=_ALL_FIELDS) -> dict:
    # external_lib_version_map only relies on module-level helpers, not on
    # instance state, so we can bypass __init__ for a focused unit test.
    serializer = GeneralSerializer.__new__(GeneralSerializer)
    return serializer.external_lib_version_map(file_content, {}, keep_pyproject_fields)["KEEP_FIELDS"]


def test_preserve_description():
    content = """
[project]
name = "azure-ai-sample"
description = "Microsoft Azure AI Sample Client Library for Python"
"""
    keep_fields = _keep_fields(content)
    assert keep_fields["project.description"] == "Microsoft Azure AI Sample Client Library for Python"


def test_preserve_classifiers():
    content = """
[project]
name = "azure-ai-sample"
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Programming Language :: Python :: 3.13",
    "Programming Language :: Python :: 3.14",
]
"""
    keep_fields = _keep_fields(content)
    assert "Programming Language :: Python :: 3.14" in keep_fields["project.classifiers"]


def test_preserve_project_urls():
    content = """
[project]
name = "azure-ai-sample"

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python-custom"
documentation = "https://aka.ms/custom-docs"
"""
    keep_fields = _keep_fields(content)
    assert keep_fields["project.urls"]["repository"] == "https://github.com/Azure/azure-sdk-for-python-custom"
    assert keep_fields["project.urls"]["documentation"] == "https://aka.ms/custom-docs"


def test_preserve_authors():
    content = """
[project]
name = "azure-ai-sample"
authors = [
    { name = "Custom Team", email = "custom-team@contoso.com" },
]
"""
    keep_fields = _keep_fields(content)
    assert keep_fields["project.authors"] == [{"name": "Custom Team", "email": "custom-team@contoso.com"}]


def test_fields_not_kept_when_option_empty():
    content = """
[project]
name = "azure-ai-sample"
description = "Microsoft Azure AI Sample Client Library for Python"
classifiers = ["Programming Language :: Python :: 3.14"]
authors = [{ name = "Custom Team", email = "custom-team@contoso.com" }]

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python-custom"
"""
    keep_fields = _keep_fields(content, keep_pyproject_fields=())
    assert "project.description" not in keep_fields
    assert "project.classifiers" not in keep_fields
    assert "project.urls" not in keep_fields
    assert "project.authors" not in keep_fields


def test_only_selected_fields_kept():
    content = """
[project]
name = "azure-ai-sample"
description = "Microsoft Azure AI Sample Client Library for Python"
classifiers = ["Programming Language :: Python :: 3.14"]
authors = [{ name = "Custom Team", email = "custom-team@contoso.com" }]

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python-custom"
"""
    keep_fields = _keep_fields(content, keep_pyproject_fields=("authors", "description"))
    assert "project.authors" in keep_fields
    assert "project.description" in keep_fields
    assert "project.classifiers" not in keep_fields
    assert "project.urls" not in keep_fields


def test_unknown_field_ignored():
    content = """
[project]
name = "azure-ai-sample"
description = "kept"
"""
    keep_fields = _keep_fields(content, keep_pyproject_fields=("description", "not-a-real-field"))
    assert keep_fields["project.description"] == "kept"
    assert "project.not-a-real-field" not in keep_fields


def test_parse_keep_pyproject_fields():
    parse = GeneralSerializer._parse_keep_pyproject_fields
    assert parse(None) == ()
    assert parse("") == ()
    assert parse("authors,description") == ("authors", "description")
    assert parse(" authors , description ") == ("authors", "description")
    assert parse(["authors", "description"]) == ("authors", "description")


def test_missing_fields_not_kept():
    content = """
[project]
name = "azure-ai-sample"
"""
    keep_fields = _keep_fields(content)
    assert "project.description" not in keep_fields
    assert "project.classifiers" not in keep_fields
    assert "project.urls" not in keep_fields
    assert "project.authors" not in keep_fields


def test_invalid_toml_returns_empty():
    assert _keep_fields("this is : not valid = toml [[[") == {}


# --- Integration test: option string -> OptionsDict -> parse -> keep -> render ---

import tomli  # noqa: E402
from pathlib import Path  # noqa: E402
from types import SimpleNamespace  # noqa: E402
from jinja2 import Environment, FileSystemLoader  # noqa: E402
from pygen import OptionsDict  # noqa: E402


_TEMPLATE_DIR = str((Path(__file__).resolve().parents[2] / "generator" / "pygen" / "codegen" / "templates"))


def _render_pyproject(option_value, existing_content):
    """Mirror the relevant wiring in GeneralSerializer.serialize_package_file:
    read the option off a real OptionsDict, parse it, extract KEEP_FIELDS from
    the existing pyproject.toml, then render the actual template."""
    options = OptionsDict(
        {
            "package-name": "azure-ai-sample",
            "package-mode": "azure-dataplane",
            "package-version": "1.0.0",
            "keep-pyproject-fields": option_value,
        }
    )
    serializer = GeneralSerializer.__new__(GeneralSerializer)
    parsed = serializer._parse_keep_pyproject_fields(options.get("keep-pyproject-fields"))
    keep_fields = serializer.external_lib_version_map(existing_content, {}, parsed)["KEEP_FIELDS"]

    env = Environment(loader=FileSystemLoader(_TEMPLATE_DIR))
    template = env.get_template("packaging_templates/pyproject.toml.jinja2")
    code_model = SimpleNamespace(
        license_header="",
        is_azure_flavor=True,
        company_name="Microsoft Corporation",
        is_tsp=True,
        namespace="azure.ai.sample",
    )
    rendered = template.render(
        KEEP_FIELDS=keep_fields,
        code_model=code_model,
        options=options,
        dev_status="5 - Production/Stable",
        token_credential=False,
        pkgutil_names=[],
        init_names=[],
        client_name="X",
        VERSION_MAP={"isodate": "0.6.1", "azure-core": "1.37.0", "typing-extensions": "4.6.0"},
        MIN_PYTHON_VERSION="3.10",
        MAX_PYTHON_VERSION="3.14",
        ADDITIONAL_DEPENDENCIES=[],
    )
    return tomli.loads(rendered)


_EXISTING = """
[project]
name = "azure-ai-sample"
description = "Microsoft Azure AI Sample Client Library for Python"
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Programming Language :: Python :: 3.99",
]
authors = [{ name = "Custom Team", email = "custom-team@contoso.com" }]

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python-custom"
"""


def test_render_keeps_selected_fields():
    parsed = _render_pyproject("authors,description", _EXISTING)["project"]
    # Selected fields are preserved from the existing file.
    assert parsed["authors"] == [{"name": "Custom Team", "email": "custom-team@contoso.com"}]
    assert parsed["description"] == "Microsoft Azure AI Sample Client Library for Python"
    # Unselected fields are regenerated (custom values dropped).
    assert "Programming Language :: Python :: 3.99" not in parsed["classifiers"]
    assert parsed["urls"]["repository"] == "https://github.com/Azure/azure-sdk-for-python"


def test_render_keeps_nothing_by_default():
    parsed = _render_pyproject("", _EXISTING)["project"]
    assert parsed["authors"] == [{"name": "Microsoft Corporation", "email": "azpysdkhelp@microsoft.com"}]
    assert parsed["description"] != "Microsoft Azure AI Sample Client Library for Python"
    assert "Programming Language :: Python :: 3.99" not in parsed["classifiers"]
    assert parsed["urls"]["repository"] == "https://github.com/Azure/azure-sdk-for-python"


def test_render_keeps_all_fields():
    parsed = _render_pyproject("authors,description,classifiers,urls", _EXISTING)["project"]
    assert parsed["authors"] == [{"name": "Custom Team", "email": "custom-team@contoso.com"}]
    assert parsed["description"] == "Microsoft Azure AI Sample Client Library for Python"
    assert "Programming Language :: Python :: 3.99" in parsed["classifiers"]
    assert parsed["urls"]["repository"] == "https://github.com/Azure/azure-sdk-for-python-custom"
