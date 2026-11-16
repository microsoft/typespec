#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import argparse
import base64
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import zipfile

if not sys.version_info >= (3, 10, 0):
    raise Exception("Autorest for Python extension requires Python 3.10 at least")

try:
    from package_manager import detect_package_manager, PackageManagerNotFoundError

    detect_package_manager()  # Just check if we have a package manager
except (ImportError, ModuleNotFoundError, PackageManagerNotFoundError):
    raise Exception("Your Python installation doesn't have a suitable package manager (pip or uv) available")


# Now we have a package manager (pip or uv) and Py >= 3.10, go to work

from pathlib import Path

from venvtools import python_run
from package_manager import install_packages, create_venv_with_package_manager

# eng/scripts/setup/build_pygen_wheel.py -> need to go up 4 levels to get to package root
_ROOT_DIR = Path(__file__).parent.parent.parent.parent

# Native browser dependencies loaded from Pyodide's own package repository at runtime.
BROWSER_NATIVE_PACKAGES = ("pyyaml", "markupsafe")


def load_pyodide_lock():
    """Read pyodide-lock.json from the pinned pyodide npm dependency instead of the Pyodide CDN."""
    expected = json.loads((_ROOT_DIR / "package.json").read_text())["dependencies"]["pyodide"]
    for directory in (_ROOT_DIR, *_ROOT_DIR.parents):
        package_dir = directory / "node_modules" / "pyodide"
        if (package_dir / "package.json").is_file():
            break
    else:
        raise RuntimeError(f"pyodide npm package not found from {_ROOT_DIR}. Run npm install before building.")
    version = json.loads((package_dir / "package.json").read_text())["version"]
    if version != expected:
        raise RuntimeError(f"Installed pyodide {version} at {package_dir} does not match pinned version {expected}.")
    return json.loads((package_dir / "pyodide-lock.json").read_text())


def write_placeholder_wheel(directory, package):
    """Write a metadata-only wheel so pip can resolve a Pyodide-provided native package offline."""
    dist_info = f"{package['name']}-{package['version']}.dist-info"
    tag = "-".join(package["file_name"].removesuffix(".whl").rsplit("-", 3)[1:])
    metadata = f"Metadata-Version: 2.1\nName: {package['name']}\nVersion: {package['version']}\n"
    metadata += "".join(f"Requires-Dist: {dependency}\n" for dependency in package.get("depends", []))
    files = {
        f"{dist_info}/METADATA": metadata,
        f"{dist_info}/WHEEL": f"Wheel-Version: 1.0\nGenerator: build_pygen_wheel\nRoot-Is-Purelib: false\nTag: {tag}\n",
    }
    record = []
    for name, content in files.items():
        digest = base64.urlsafe_b64encode(hashlib.sha256(content.encode()).digest()).rstrip(b"=").decode()
        record.append(f"{name},sha256={digest},{len(content.encode())}")
    files[f"{dist_info}/RECORD"] = "\n".join([*record, f"{dist_info}/RECORD,,"]) + "\n"
    with zipfile.ZipFile(directory / package["file_name"], "w") as archive:
        for name, content in files.items():
            archive.writestr(name, content)


def build_browser_wheels(venv_context):
    dist = _ROOT_DIR / "generator" / "dist"
    wheel = next(dist.glob("pygen-*.whl"), None)
    if wheel is None:
        raise RuntimeError(f"Generator wheel not found in {dist}. Build the generator before preparing browser wheels.")
    lock = load_pyodide_lock()

    # These native extensions must match the browser's WebAssembly runtime, not the build host.
    # The browser loads them from Pyodide at runtime, so pip only needs their metadata to resolve.
    native = [lock["packages"][name] for name in BROWSER_NATIVE_PACKAGES]
    native_wheels = [package["file_name"] for package in native]
    _, abi, platform = native_wheels[0].removesuffix(".whl").rsplit("-", 2)
    with tempfile.TemporaryDirectory(dir=dist) as directory:
        staging = Path(directory) / "download"
        links = Path(directory) / "pyodide"
        links.mkdir()
        for package in native:
            write_placeholder_wheel(links, package)
        command = [
            venv_context.env_exe,
            "-m",
            "pip",
            "download",
            str(wheel),
            # Later platformdirs releases import os.geteuid, which Pyodide does not provide.
            "platformdirs==4.3.8",
            *[f"{package['name']}=={package['version']}" for package in native],
            f"--find-links={links}",
            f"--dest={staging}",
            "--only-binary=:all:",
            f"--python-version={lock['info']['python']}",
            f"--platform={platform}",
            "--implementation=cp",
            f"--abi={abi}",
        ]
        env = os.environ.copy()
        env["PIP_INDEX_URL"] = (
            env.get("PIP_INDEX_URL")
            or env.get("UV_DEFAULT_INDEX")
            or "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-python/pypi/simple/"
        )
        subprocess.run(command, env=env, check=True)

        unexpected = [
            p.name
            for p in staging.glob("*.whl")
            if not p.name.endswith("-none-any.whl") and p.name not in native_wheels
        ]
        if unexpected:
            raise RuntimeError(f"Unsupported native browser dependencies: {', '.join(unexpected)}")
        browser = dist / "browser"
        if browser.exists():
            shutil.rmtree(browser)
        browser.mkdir()
        wheels = sorted(p.name for p in staging.glob("*-none-any.whl"))
        for filename in wheels:
            shutil.copyfile(staging / filename, browser / filename)
        (browser / "manifest.json").write_text(json.dumps({"wheels": wheels}, indent=2) + "\n")


def main(playground=False):
    venv_path = _ROOT_DIR / "venv_build_wheel"
    venv_context = create_venv_with_package_manager(venv_path)

    # uv environments are unseeded; playground wheel downloads also need pip.
    install_packages(["build", "pip==26.2.2"] if playground else ["build"], venv_context)
    python_run(venv_context, "build", ["--wheel"], additional_dir="generator")
    if playground:
        build_browser_wheels(venv_context)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--playground", action="store_true", help="Prepare browser dependency wheels for the playground"
    )
    main(playground=parser.parse_args().playground)
