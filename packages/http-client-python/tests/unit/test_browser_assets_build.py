# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import importlib
from pathlib import Path
from unittest.mock import Mock

import pytest


@pytest.fixture
def testserver():
    """Build-script tests do not use the HTTP mock server."""


@pytest.fixture
def builders(monkeypatch):
    monkeypatch.syspath_prepend(str(Path(__file__).resolve().parents[2] / "eng" / "scripts" / "setup"))
    wheel = importlib.import_module("build_pygen_wheel")
    assets = importlib.import_module("build_playground_assets")
    for name in ("create_venv_with_package_manager", "install_packages", "python_run"):
        monkeypatch.setattr(wheel, name, Mock())
    for name in ("create_venv_with_package_manager", "build_browser_assets"):
        monkeypatch.setattr(assets, name, Mock())
    if hasattr(wheel, "build_browser_assets"):
        monkeypatch.setattr(wheel, "build_browser_assets", assets.build_browser_assets)
    return wheel, assets


def test_normal_wheel_build_does_not_prepare_browser_assets(builders, monkeypatch):
    wheel, assets = builders
    monkeypatch.setattr("sys.argv", ["build_pygen_wheel.py"])

    wheel.main()

    wheel.python_run.assert_called_once_with(
        wheel.create_venv_with_package_manager.return_value,
        "build",
        ["--wheel"],
        additional_dir="generator",
    )
    assets.build_browser_assets.assert_not_called()


def test_playground_asset_build_is_separate_from_wheel_build(builders):
    wheel, assets = builders

    assets.main()

    assets.build_browser_assets.assert_called_once_with(assets.create_venv_with_package_manager.return_value)
    wheel.python_run.assert_not_called()
