from pathlib import Path

import pytest

GENERATED_DIR = Path(__file__).parent / "../../../generated"
FLAVORS = ("azure", "unbranded")


def _package_dirs():
    base = GENERATED_DIR.resolve()
    dirs = []
    for flavor in FLAVORS:
        flavor_dir = base / flavor
        if not flavor_dir.is_dir():
            continue
        dirs.extend(sorted(p for p in flavor_dir.iterdir() if p.is_dir()))
    return dirs


@pytest.mark.parametrize(
    "package_dir",
    _package_dirs(),
    ids=lambda p: f"{p.parent.name}/{p.name}",
)
def test_readme_exists(package_dir: Path):
    """Each generated SDK package folder (azure & unbranded) must contain a README.md."""
    readme_path = package_dir / "README.md"
    assert readme_path.is_file(), f"README.md not found at {readme_path}"
