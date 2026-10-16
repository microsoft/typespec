# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Post-processing must only touch files written by the current generation."""

import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import black
import pytest
import yaml

from pygen import ReaderAndWriter
from pygen.black import BlackScriptPlugin
from pygen.codegen import CodeGenerator

_PACKAGE_ROOT = Path(__file__).resolve().parents[2]
_UNFORMATTED = "value={'key':1}\n# " + "x" * 121 + "\n" + "# filler\n" * 1000
_USER_FILES = (
    "tests/test_custom.py",
    "samples/custom.py",
    "custom.py",
    "contoso/widget/custom.py",
    "generated_tests/test_custom.py",
    "generated_samples/custom.py",
)


def _seed_user_files(output_folder):
    contents = {}
    for name in _USER_FILES:
        path = output_folder / name
        path.parent.mkdir(parents=True, exist_ok=True)
        content = b"\xef\xbb\xbf" + _UNFORMATTED.replace("\n", "\r\n").encode()
        path.write_bytes(content)
        contents[path] = content
    return contents


def _assert_user_files_unchanged(contents):
    for path, content in contents.items():
        assert path.read_bytes() == content, path


def _assert_formatted(path):
    content = path.read_text(encoding="utf-8")
    assert 'value = {"key": 1}' in content
    assert content.splitlines()[0] == "# pylint: disable=line-too-long,useless-suppression,too-many-lines"


def _load_setup_script(name):
    spec = importlib.util.spec_from_file_location(name, _PACKAGE_ROOT / "eng/scripts/setup" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _write_code_model(path, has_operations=False):
    operation_groups = []
    if has_operations:
        operation_groups.append(
            {
                "className": "WidgetOperations",
                "identifyName": "widgets",
                "propertyName": "widgets",
                "operations": [
                    {
                        "name": "ping",
                        "description": "Ping.",
                        "groupName": "widgets",
                        "url": "/ping",
                        "method": "GET",
                        "parameters": [],
                        "responses": [{"statusCodes": [204], "headers": []}],
                        "exceptions": [],
                        "overloads": [],
                        "isOverload": False,
                        "discriminator": "operation",
                        "apiVersions": [],
                        "samples": {
                            "ping": {
                                "x-ms-original-file": "ping.json",
                                "parameters": {},
                                "responses": {"204": {}},
                            }
                        },
                    }
                ],
            }
        )
    path.write_text(
        yaml.safe_dump(
            {
                "namespace": "contoso.widget",
                "types": [],
                "clients": [
                    {
                        "name": "WidgetClient",
                        "description": "A widget client.",
                        "namespace": "contoso.widget",
                        "moduleName": "widget",
                        "parameters": [],
                        "url": "https://example.org",
                        "operationGroups": operation_groups,
                    }
                ],
            }
        ),
        encoding="utf-8",
    )


def test_only_explicit_python_files_are_post_processed(tmp_path):
    contents = _seed_user_files(tmp_path)
    generated = tmp_path / "contoso/widget/_generated/client.py"
    regenerated = tmp_path / "setup.py"
    outside = tmp_path.parent / f"{tmp_path.name}_generated_sample.py"
    non_python = tmp_path / "README.md"
    files = [generated, regenerated, outside, non_python]
    for path in files:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(_UNFORMATTED if path.suffix == ".py" else "Not Python!", encoding="utf-8")

    try:
        BlackScriptPlugin(output_folder=tmp_path, files=files).process()

        _assert_user_files_unchanged(contents)
        for path in files[:-1]:
            _assert_formatted(path)
        assert non_python.read_text(encoding="utf-8") == "Not Python!"
    finally:
        outside.unlink()


@pytest.mark.parametrize("files", [[], ()])
def test_empty_file_set_does_not_scan_output(tmp_path, files):
    contents = _seed_user_files(tmp_path)

    BlackScriptPlugin(output_folder=tmp_path, files=files).process()

    _assert_user_files_unchanged(contents)


def test_missing_file_list_is_not_a_directory_scan(tmp_path):
    with pytest.raises(TypeError):
        BlackScriptPlugin(output_folder=tmp_path)


def test_missing_emitted_file_is_reported(tmp_path, caplog):
    path = tmp_path / "missing.py"
    with pytest.raises(FileNotFoundError):
        BlackScriptPlugin(output_folder=tmp_path, files=[path]).process()
    assert "failed to format" in caplog.text
    assert not path.exists()


@pytest.mark.parametrize("include_files", [False, True])
def test_black_cli_requires_explicit_files(tmp_path, include_files):
    contents = _seed_user_files(tmp_path)
    path = tmp_path / "emitted.py"
    path.write_text(_UNFORMATTED, encoding="utf-8")
    command = [sys.executable, "-m", "pygen.black", "--output-folder", str(tmp_path)]
    if include_files:
        command.append(str(path))

    result = subprocess.run(command, capture_output=True, text=True, check=False, timeout=30)

    assert result.returncode == (0 if include_files else 2), result.stderr
    _assert_user_files_unchanged(contents)
    if include_files:
        _assert_formatted(path)
    else:
        assert "files" in result.stderr
        assert path.read_text(encoding="utf-8") == _UNFORMATTED


@pytest.mark.parametrize("line_length", [120, 121])
@pytest.mark.parametrize("line_count", [1000, 1001])
def test_pylint_suppression_thresholds(tmp_path, line_length, line_count):
    path = tmp_path / "generated.py"
    path.write_text("#" * line_length + "\n" + "# filler\n" * (line_count - 1), encoding="utf-8")

    BlackScriptPlugin(output_folder=tmp_path, files=[path]).process()

    content = path.read_text(encoding="utf-8")
    assert ("line-too-long" in content) == (line_length > 120)
    assert ("useless-suppression" in content) == (line_length > 120)
    assert ("too-many-lines" in content) == (line_count > 1000)


def test_existing_suppressions_are_not_duplicated(tmp_path):
    path = tmp_path / "generated.py"
    path.write_text("# pylint: disable=unused-import\n" + _UNFORMATTED, encoding="utf-8")
    formatter = BlackScriptPlugin(output_folder=tmp_path, files=[path])
    formatter.process()
    content = path.read_bytes()

    formatter.process()

    assert path.read_bytes() == content
    assert path.read_text(encoding="utf-8").splitlines()[0] == (
        "# pylint: disable=unused-import,line-too-long,useless-suppression,too-many-lines"
    )


def test_writer_tracks_successful_new_and_existing_writes(tmp_path):
    output_folder = tmp_path / "output"
    writer = ReaderAndWriter(output_folder=output_folder)
    path = output_folder / "sdk/client.py"
    writer.write_file("sdk/client.py", "value=1\n")
    writer.write_file(path, "value=2\n")
    writer.write_file(Path("sdk") / ".." / "sdk" / "client.py", "value=3\n")
    writer.write_file("../setup.py", "value=4\n")

    assert writer.written_files == {path.resolve(), (tmp_path / "setup.py").resolve()}
    assert ReaderAndWriter(output_folder=output_folder).written_files == set()

    with pytest.raises(OSError):
        writer.write_file("sdk", "cannot write a directory")
    assert (output_folder / "sdk").resolve() not in writer.written_files


@pytest.mark.parametrize("generation_subdir", [None, "_generated"])
@pytest.mark.parametrize("no_namespace_folders", [False, True])
def test_generator_tracks_all_serializer_writes_and_resets_on_rerun(
    tmp_path, monkeypatch, generation_subdir, no_namespace_folders
):
    output_folder = tmp_path / "contoso/widget" if no_namespace_folders else tmp_path
    output_folder.mkdir(parents=True, exist_ok=True)
    contents = _seed_user_files(output_folder)
    yaml_path = tmp_path / "code-model.yaml"
    _write_code_model(yaml_path)
    generator = CodeGenerator(
        output_folder=output_folder,
        tsp_file=str(yaml_path),
        **{
            "flavor": "unbranded",
            "from-typespec": True,
            "generation-subdir": generation_subdir,
            "no-namespace-folders": no_namespace_folders,
            "package-mode": "azure-dataplane",
            "keep-setup-py": True,
            "package-name": "contoso-widget",
            "package-version": "1.0.0",
        },
    )
    generator.process()

    assert generator.written_files
    assert (tmp_path / "setup.py").resolve() in generator.written_files
    assert not set(contents).intersection(generator.written_files)
    assert all(path.is_absolute() and path.is_file() for path in generator.written_files)
    BlackScriptPlugin(output_folder=output_folder, files=generator.written_files).process()
    _assert_user_files_unchanged(contents)
    for path in generator.written_files:
        if path.suffix == ".py":
            content = path.read_text(encoding="utf-8")
            assert black.format_str(content, mode=black.Mode(line_length=120)) == content

    monkeypatch.setattr("pygen.codegen.JinjaSerializer.serialize", lambda self: None)
    generator.process()
    assert generator.written_files == set()


def test_shared_native_and_pyodide_pipeline_preserves_user_files(tmp_path):
    from pygen.generate import generate

    contents = _seed_user_files(tmp_path)
    yaml_path = tmp_path / "code-model.yaml"
    _write_code_model(yaml_path)
    templates = tmp_path / "templates"
    templates.mkdir()
    (templates / "setup.py.jinja2").write_text(_UNFORMATTED, encoding="utf-8")
    options = {
        "from-typespec": True,
        "package-mode": str(templates),
        "keep-setup-py": True,
        "package-version": "1.0.0",
    }

    generate(output_folder=tmp_path, tsp_file=str(yaml_path), flavor="unbranded", **options)

    _assert_user_files_unchanged(contents)
    assert (tmp_path / "contoso/widget/__init__.py").is_file()
    _assert_formatted(tmp_path / "setup.py")
    (tmp_path / "setup.py").write_text("old=True\n", encoding="utf-8")

    generate(output_folder=tmp_path, tsp_file=str(yaml_path), flavor="unbranded", **options)

    _assert_formatted(tmp_path / "setup.py")
    _assert_user_files_unchanged(contents)


@pytest.mark.parametrize("generate_test", [False, True])
@pytest.mark.parametrize("generate_sample", [False, True])
@pytest.mark.parametrize("no_namespace_folders", [False, True])
def test_generated_tests_and_samples_are_formatted_only_when_written(
    tmp_path, caplog, generate_test, generate_sample, no_namespace_folders
):
    from pygen.generate import generate

    output_folder = tmp_path / "contoso/widget" if no_namespace_folders else tmp_path
    output_folder.mkdir(parents=True, exist_ok=True)
    contents = _seed_user_files(tmp_path)
    yaml_path = tmp_path / "code-model.yaml"
    _write_code_model(yaml_path, has_operations=True)

    generate(
        output_folder=output_folder,
        tsp_file=str(yaml_path),
        flavor="unbranded",
        **{
            "from-typespec": True,
            "generate-test": generate_test,
            "generate-sample": generate_sample,
            "generation-subdir": "_generated",
            "no-namespace-folders": no_namespace_folders,
        },
    )

    assert not [record for record in caplog.records if record.levelname == "ERROR"]
    _assert_user_files_unchanged(contents)
    for folder, enabled in (("generated_tests", generate_test), ("generated_samples", generate_sample)):
        generated_files = set((tmp_path / folder).rglob("*.py")) - set(contents)
        assert bool(generated_files) == enabled
        for path in generated_files:
            content = path.read_text(encoding="utf-8")
            assert black.format_str(content, mode=black.Mode(line_length=120)) == content


@pytest.mark.parametrize("has_operations,show_operations", [(False, True), (True, False)])
def test_tests_and_samples_require_visible_operations(tmp_path, has_operations, show_operations):
    from pygen.generate import generate

    contents = _seed_user_files(tmp_path)
    yaml_path = tmp_path / "code-model.yaml"
    _write_code_model(yaml_path, has_operations=has_operations)

    generate(
        output_folder=tmp_path,
        tsp_file=str(yaml_path),
        flavor="unbranded",
        **{
            "from-typespec": True,
            "generate-test": True,
            "generate-sample": True,
            "show-operations": show_operations,
            "combine-operation-files": show_operations,
            "builders-visibility": "public",
        },
    )

    _assert_user_files_unchanged(contents)
    for folder in ("generated_tests", "generated_samples"):
        assert not set((tmp_path / folder).rglob("*.py")) - set(contents)


def test_native_entry_point_preserves_user_files(tmp_path, monkeypatch):
    run_tsp = _load_setup_script("run_tsp")
    monkeypatch.setattr(run_tsp, "_ROOT_DIR", tmp_path)
    (tmp_path / "venv").mkdir()
    output_folder = tmp_path / "output"
    contents = _seed_user_files(output_folder)
    yaml_path = tmp_path / "code-model.yaml"
    _write_code_model(yaml_path)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "run_tsp.py",
            f"--output-folder={output_folder}",
            f"--tsp-file={yaml_path}",
            "--flavor=unbranded",
            "--from-typespec=true",
        ],
    )

    run_tsp.main()

    _assert_user_files_unchanged(contents)
    assert (output_folder / "contoso/widget/__init__.py").is_file()


def test_batch_worker_returns_only_files_written_this_run(tmp_path):
    run_batch = _load_setup_script("run_batch")
    contents = _seed_user_files(tmp_path)
    yaml_path = tmp_path / "code-model.yaml"
    _write_code_model(yaml_path)
    config_path = tmp_path / ".tsp-codegen-test.json"
    config_path.write_text(
        json.dumps(
            {
                "yamlPath": str(yaml_path),
                "outputDir": str(tmp_path),
                "commandArgs": {"flavor": "unbranded", "from-typespec": "true"},
            }
        ),
        encoding="utf-8",
    )

    output_dir, success, error, files = run_batch.process_single_spec(str(config_path))

    assert success, error
    assert output_dir == str(tmp_path)
    assert files and not set(contents).intersection(files)
    BlackScriptPlugin(output_folder=output_dir, files=files).process()
    _assert_user_files_unchanged(contents)
    assert not config_path.exists()


def test_batch_parent_formats_only_worker_writes(tmp_path):
    contents = {}
    for name in ("first", "second"):
        output_folder = tmp_path / "tests/generated/unbranded" / name
        contents.update(_seed_user_files(output_folder))
        yaml_path = tmp_path / f"{name}.yaml"
        _write_code_model(yaml_path)
        templates = output_folder / "templates"
        templates.mkdir()
        (templates / "setup.py.jinja2").write_text(_UNFORMATTED, encoding="utf-8")
        (output_folder / ".tsp-codegen-test.json").write_text(
            json.dumps(
                {
                    "yamlPath": str(yaml_path),
                    "outputDir": str(output_folder),
                    "commandArgs": {
                        "flavor": "unbranded",
                        "from-typespec": "true",
                        "package-mode": str(templates),
                        "keep-setup-py": "true",
                        "package-version": "1.0.0",
                    },
                }
            ),
            encoding="utf-8",
        )

    result = subprocess.run(
        [
            sys.executable,
            str(_PACKAGE_ROOT / "eng/scripts/setup/run_batch.py"),
            "--generated-dir",
            str(tmp_path),
            "--flavor",
            "unbranded",
            "--jobs",
            "2",
        ],
        capture_output=True,
        text=True,
        check=False,
        timeout=120,
    )

    assert result.returncode == 0, result.stdout + result.stderr
    _assert_user_files_unchanged(contents)
    for name in ("first", "second"):
        _assert_formatted(tmp_path / "tests/generated/unbranded" / name / "setup.py")
