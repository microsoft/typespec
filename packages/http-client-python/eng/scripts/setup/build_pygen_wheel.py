#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json
import os
import shutil
import subprocess
import sys
import tarfile
from tempfile import TemporaryDirectory

if not sys.version_info >= (3, 10, 0):
    raise Exception("Autorest for Python extension requires Python 3.10 at least")

try:
    from package_manager import detect_package_manager, PackageManagerNotFoundError

    detect_package_manager()  # Just check if we have a package manager
except (ImportError, ModuleNotFoundError, PackageManagerNotFoundError):
    raise Exception(
        "Your Python installation doesn't have a suitable package manager (pip or uv) available"
    )


# Now we have a package manager (pip or uv) and Py >= 3.10, go to work

from pathlib import Path

from venvtools import python_run
from package_manager import install_packages, create_venv_with_package_manager

# eng/scripts/setup/build_pygen_wheel.py -> need to go up 4 levels to get to package root
_ROOT_DIR = Path(__file__).parent.parent.parent.parent
_PYODIDE_RUNTIME_FILES = (
    "pyodide.js",
    "pyodide.js.map",
    "pyodide.asm.js",
    "pyodide.asm.wasm",
    "python_stdlib.zip",
    "pyodide-lock.json",
)
_PYODIDE_BINARY_WHEELS = (
    "packaging==23.2",
    "micropip==0.6.0",
    "click==8.1.7",
)
_PYODIDE_SOURCE_PACKAGES = ("PyYAML-6.0.1", "MarkupSafe-2.1.5")


def main():
    venv_path = _ROOT_DIR / "venv_build_wheel"
    venv_context = create_venv_with_package_manager(venv_path)

    install_packages(["build", "setuptools", "wheel", "pip"], venv_context)
    python_run(venv_context, "build", ["--wheel"], additional_dir="generator")
    build_browser_wheels(venv_context)


def download_wheels(requirements, destination, python):
    subprocess.run(
        [
            python,
            "-m",
            "pip",
            "download",
            "--no-deps",
            "--only-binary=:all:",
            "--platform",
            "any",
            "--python-version",
            "3.12",
            "--implementation",
            "py",
            "--abi",
            "none",
            *requirements,
            "-d",
            str(destination),
        ],
        check=True,
    )


def build_pure_source_wheel(package, source_dir, wheel_dir, python):
    archive_path = source_dir / f"{package}.tar.gz"
    with tarfile.open(archive_path) as archive:
        for entry in archive:
            path = (source_dir / entry.name).resolve()
            if not path.is_relative_to(source_dir.resolve()) or not (
                entry.isfile() or entry.isdir()
            ):
                raise RuntimeError(
                    f"Unsafe browser Python source archive: {archive_path}"
                )
        archive.extractall(source_dir)

    package_dir = source_dir / package
    environment = os.environ.copy()
    if package.startswith("PyYAML-"):
        environment["PYYAML_FORCE_LIBYAML"] = "0"
    else:
        # MarkupSafe has no build flag to disable its optional native speedups.
        setup_py = package_dir / "setup.py"
        source = setup_py.read_text()
        extension = 'ext_modules = [Extension("markupsafe._speedups", ["src/markupsafe/_speedups.c"])]'
        if source.count(extension) != 1:
            raise RuntimeError("Unexpected MarkupSafe extension configuration")
        setup_py.write_text(source.replace(extension, "ext_modules = []"))
    subprocess.run(
        [python, "setup.py", "bdist_wheel", "--dist-dir", str(wheel_dir)],
        cwd=package_dir,
        env=environment,
        check=True,
    )


def copy_pyodide_runtime(dist):
    package = _ROOT_DIR / "node_modules" / "pyodide"
    installed_version = json.loads((package / "package.json").read_text())["version"]
    expected_version = json.loads((_ROOT_DIR / "package.json").read_text())[
        "dependencies"
    ]["pyodide"]
    if installed_version != expected_version:
        raise RuntimeError(
            f"Expected Pyodide {expected_version}, found {installed_version}"
        )
    locked_packages = json.loads((package / "pyodide-lock.json").read_text())[
        "packages"
    ]
    for requirement in _PYODIDE_BINARY_WHEELS:
        name, version = requirement.split("==")
        if locked_packages[name]["version"] != version:
            raise RuntimeError(
                f"Pyodide's {name} version no longer matches {requirement}"
            )
    for source in _PYODIDE_SOURCE_PACKAGES:
        name, version = source.rsplit("-", 1)
        if locked_packages[name.lower()]["version"] != version:
            raise RuntimeError(f"Pyodide's {name} version no longer matches {source}")
    runtime_dir = dist / "pyodide"
    runtime_dir.mkdir(exist_ok=True)
    for name in _PYODIDE_RUNTIME_FILES:
        shutil.copyfile(package / name, runtime_dir / name)


def build_browser_wheels(venv_context):
    requirements = _ROOT_DIR / "generator" / "browser-requirements.txt"
    dist = _ROOT_DIR / "generator" / "dist"
    wheel_dir = dist / "browser-wheels"
    with TemporaryDirectory() as temp:
        download_wheels(["-r", str(requirements)], temp, venv_context.env_exe)
        wheels = sorted(Path(temp).glob("*.whl"))
        expected = sum(
            1
            for line in requirements.read_text().splitlines()
            if line.strip() and not line.startswith("#")
        )
        if len(wheels) != expected or any(
            not wheel.name.endswith("-py3-none-any.whl") for wheel in wheels
        ):
            raise RuntimeError(
                "Browser Python requirements must resolve to one pure-Python wheel each"
            )

        wheel_dir.mkdir(exist_ok=True)
        for stale in wheel_dir.glob("*.whl"):
            stale.unlink()
        for wheel in wheels:
            shutil.copyfile(wheel, wheel_dir / wheel.name)

        pyodide_wheel_dir = dist / "pyodide-wheels"
        pyodide_wheel_dir.mkdir(exist_ok=True)
        for stale in pyodide_wheel_dir.glob("*.whl"):
            stale.unlink()
        with TemporaryDirectory() as sources:
            source_dir = Path(sources)
            download_wheels(
                _PYODIDE_BINARY_WHEELS, pyodide_wheel_dir, venv_context.env_exe
            )
            subprocess.run(
                [
                    venv_context.env_exe,
                    "-m",
                    "pip",
                    "download",
                    "--no-deps",
                    "--no-binary=:all:",
                    "--no-build-isolation",
                    *(
                        package.replace("-", "==", 1)
                        for package in _PYODIDE_SOURCE_PACKAGES
                    ),
                    "-d",
                    str(source_dir),
                ],
                check=True,
            )
            for package in _PYODIDE_SOURCE_PACKAGES:
                build_pure_source_wheel(
                    package, source_dir, pyodide_wheel_dir, venv_context.env_exe
                )

        pyodide_wheels = sorted(pyodide_wheel_dir.glob("*.whl"))
        if len(pyodide_wheels) != 5 or any(
            not wheel.name.endswith("-py3-none-any.whl") for wheel in pyodide_wheels
        ):
            raise RuntimeError("Pyodide browser packages must be pure-Python wheels")
        pyodide_by_name = {
            wheel.name.split("-")[0].lower(): wheel.name for wheel in pyodide_wheels
        }
        if set(pyodide_by_name) != {
            "packaging",
            "micropip",
            "click",
            "pyyaml",
            "markupsafe",
        }:
            raise RuntimeError("Missing required Pyodide browser packages")
        copy_pyodide_runtime(dist)
        (dist / "browser-wheels.json").write_text(
            json.dumps(
                {
                    "generator": [wheel.name for wheel in wheels],
                    "pyodide": [
                        pyodide_by_name[name]
                        for name in (
                            "packaging",
                            "micropip",
                            "click",
                            "pyyaml",
                            "markupsafe",
                        )
                    ],
                }
            )
        )


if __name__ == "__main__":
    main()
