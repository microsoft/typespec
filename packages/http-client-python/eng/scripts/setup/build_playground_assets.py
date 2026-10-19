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
from email.parser import BytesParser
from tempfile import TemporaryDirectory
from zipfile import ZipFile

if not sys.version_info >= (3, 10, 0):
    raise Exception("Autorest for Python extension requires Python 3.10 at least")

try:
    from package_manager import detect_package_manager, PackageManagerNotFoundError

    detect_package_manager()  # Just check if we have a package manager
except (ImportError, ModuleNotFoundError, PackageManagerNotFoundError):
    raise Exception("Your Python installation doesn't have a suitable package manager (pip or uv) available")


# Now we have a package manager (pip or uv) and Py >= 3.10, go to work

from pathlib import Path

from package_manager import create_venv_with_package_manager, get_install_command

# eng/scripts/setup/build_playground_assets.py -> need to go up 4 levels to get to package root
_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv_build_wheel"
    venv_context = create_venv_with_package_manager(venv_path)
    build_browser_assets(venv_context)


def build_browser_assets(venv_context):
    dist = _ROOT_DIR / "generator" / "dist"
    runtime = _ROOT_DIR / "node_modules" / "pyodide"
    version = json.loads((_ROOT_DIR / "package.json").read_text())["dependencies"]["pyodide"]
    if json.loads((runtime / "package.json").read_text())["version"] != version:
        raise RuntimeError(f"Expected installed Pyodide {version}")
    packages = json.loads((runtime / "pyodide-lock.json").read_text())["packages"]
    environment = {
        **os.environ,
        "PIP_INDEX_URL": "https://packagefeedproxy.microsoft.io/pypi/simple/",
        "PIP_EXTRA_INDEX_URL": "",
        "PIP_CONFIG_FILE": os.devnull,
        "UV_DEFAULT_INDEX": "https://packagefeedproxy.microsoft.io/pypi/simple/",
        "PYYAML_FORCE_LIBYAML": "0",
    }
    subprocess.run(
        get_install_command(detect_package_manager(), venv_context) + ["pip", "setuptools", "wheel"],
        env=environment,
        check=True,
    )
    pip = [venv_context.env_exe, "-m", "pip", "download"]
    with TemporaryDirectory() as temp:
        root = Path(temp)
        wheels = root / "wheels"
        wheels.mkdir()
        # These optional native extensions are unavailable in browser Python.
        for name in ("pyyaml", "markupsafe"):
            package_version = packages[name]["version"]
            source_dir = root / name
            source_dir.mkdir()
            subprocess.run(
                pip
                + [
                    f"{name}=={package_version}",
                    "--no-deps",
                    "--no-binary=:all:",
                    "--no-build-isolation",
                    "-d",
                    str(source_dir),
                ],
                env=environment,
                check=True,
            )
            archives = list(source_dir.glob("*.tar.gz"))
            if len(archives) != 1:
                raise RuntimeError(f"Expected one source archive for {name}")
            with tarfile.open(archives[0]) as archive:
                for entry in archive:
                    target = (source_dir / entry.name).resolve()
                    if not target.is_relative_to(source_dir.resolve()) or not (entry.isfile() or entry.isdir()):
                        raise RuntimeError(f"Unsafe source archive for {name}")
                archive.extractall(source_dir)
            sources = [path for path in source_dir.iterdir() if path.is_dir()]
            if len(sources) != 1:
                raise RuntimeError(f"Expected one source directory for {name}")
            if name == "markupsafe":
                setup = sources[0] / "setup.py"
                text = setup.read_text()
                extension = 'ext_modules = [Extension("markupsafe._speedups", ["src/markupsafe/_speedups.c"])]'
                if text.count(extension) != 1:
                    raise RuntimeError("Unexpected MarkupSafe extension configuration")
                setup.write_text(text.replace(extension, "ext_modules = []"))
            subprocess.run(
                [venv_context.env_exe, "setup.py", "bdist_wheel", "--dist-dir", str(wheels)],
                cwd=sources[0],
                env=environment,
                check=True,
            )
        with ZipFile(dist / "pygen-0.1.0-py3-none-any.whl") as wheel:
            metadata = BytesParser().parsebytes(wheel.read("pygen-0.1.0.dist-info/METADATA"))
        requirements = metadata.get_all("Requires-Dist", [])
        requirements += [f"{name}=={packages[name]['version']}" for name in ("packaging", "micropip", "click")]
        subprocess.run(
            pip
            + [
                *requirements,
                "--find-links",
                str(wheels),
                "--only-binary=:all:",
                "--platform",
                "any",
                "--python-version",
                "3.12",
                "--implementation",
                "py",
                "--abi",
                "none",
                "-d",
                str(wheels),
            ],
            env=environment,
            check=True,
        )
        filenames = sorted(path.name for path in wheels.glob("*.whl"))
        if not filenames or any(
            not name.endswith(("-py3-none-any.whl", "-py2.py3-none-any.whl")) for name in filenames
        ):
            raise RuntimeError(f"Browser dependencies must be pure-Python wheels: {filenames}")
        bootstrap = [f"{name}-{packages[name]['version']}-py3-none-any.whl" for name in ("packaging", "micropip")]
        if not all(name in filenames for name in bootstrap):
            raise RuntimeError("Missing browser bootstrap wheels")
        wheel_dir = dist / "browser-wheels"
        wheel_dir.mkdir(exist_ok=True)
        for stale in wheel_dir.glob("*.whl"):
            stale.unlink()
        for name in filenames:
            shutil.copyfile(wheels / name, wheel_dir / name)
        (dist / "browser-wheels.json").write_text(
            json.dumps(bootstrap + [name for name in filenames if name not in bootstrap])
        )
    runtime_dir = dist / "pyodide"
    runtime_dir.mkdir(exist_ok=True)
    for name in ("pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"):
        shutil.copyfile(runtime / name, runtime_dir / name)


if __name__ == "__main__":
    main()
