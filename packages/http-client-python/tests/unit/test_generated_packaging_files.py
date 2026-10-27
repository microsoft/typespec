# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Verify regenerated test packages emit pyproject.toml, not setup.py.

The Python emitter passes options to pygen via JSON config files. Boolean
flags arrive as the strings "true"/"false". If those strings are not coerced
to real booleans before being unpacked as kwargs to pygen, a value like
keep-setup-py="false" is treated as truthy in Python and pygen emits
setup.py instead of pyproject.toml. This test guards against that
regression by walking the regenerated test fixtures.
"""
from pathlib import Path

import pytest

# Packages that intentionally opt into setup.py via keep-setup-py=true in
# eng/scripts/ci/regenerate.ts. They should have setup.py and no pyproject.toml.
KEEP_SETUP_PY_PACKAGES = {"setuppy-authentication-union"}

_GENERATED_ROOT = Path(__file__).resolve().parents[1] / "generated"


def _iter_generated_packages():
    if not _GENERATED_ROOT.is_dir():
        return
    for flavor_dir in sorted(_GENERATED_ROOT.iterdir()):
        if not flavor_dir.is_dir():
            continue
        for pkg_dir in sorted(flavor_dir.iterdir()):
            if not pkg_dir.is_dir():
                continue
            yield flavor_dir.name, pkg_dir


@pytest.mark.parametrize(
    "flavor,pkg_dir",
    list(_iter_generated_packages()),
    ids=lambda v: v.name if isinstance(v, Path) else v,
)
def test_generated_package_uses_pyproject_toml(flavor, pkg_dir):
    has_setup_py = (pkg_dir / "setup.py").is_file()
    has_pyproject = (pkg_dir / "pyproject.toml").is_file()

    if pkg_dir.name in KEEP_SETUP_PY_PACKAGES:
        assert has_setup_py, f"{flavor}/{pkg_dir.name} should have setup.py (keep-setup-py=true)"
        assert not has_pyproject, (
            f"{flavor}/{pkg_dir.name} should NOT have pyproject.toml (keep-setup-py=true)"
        )
        return

    assert has_pyproject, (
        f"{flavor}/{pkg_dir.name} is missing pyproject.toml. "
        f"This usually means string boolean args (e.g. keep-setup-py=\"false\") "
        f"were not coerced to real booleans before being passed to pygen. "
        f"See eng/scripts/setup/run_batch.py."
    )
    assert not has_setup_py, (
        f"{flavor}/{pkg_dir.name} has setup.py but should use pyproject.toml. "
        f"This usually means string boolean args (e.g. keep-setup-py=\"false\") "
        f"were not coerced to real booleans before being passed to pygen. "
        f"See eng/scripts/setup/run_batch.py."
    )
