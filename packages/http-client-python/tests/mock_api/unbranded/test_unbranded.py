# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
import os
from pathlib import Path
import traceback
from importlib import import_module
import pytest
from typetest.scalar import ScalarClient
from corehttp.exceptions import HttpResponseError


@pytest.fixture
def client():
    with ScalarClient() as client:
        yield client


def test_module():
    with pytest.raises(ModuleNotFoundError):
        import_module("azure")


def test_track_back(client: ScalarClient):
    try:
        client.string.put("to raise exception")
    except HttpResponseError:
        track_back = traceback.format_exc().lower()
        assert "azure" not in track_back
        assert "microsoft" not in track_back


_SKIP_DIRS = {"__pycache__", "pytest_cache", ".pytest_cache", "generated_tests"}


def check_sensitive_word(folder: Path, word: str) -> list[str]:
    """Search for a word in all files under folder, return top-level subfolder names that contain it."""
    result = set()
    for path in folder.rglob("*"):
        if not path.is_file():
            continue
        # Skip special directories
        if _SKIP_DIRS & set(path.relative_to(folder).parts):
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except (OSError, UnicodeDecodeError):
            continue
        if word.lower() in content.lower():
            result.add(path.relative_to(folder).parts[0])
    return sorted(result)


def test_sensitive_word():
    check_folder = (Path(os.path.dirname(__file__)) / "../../generated/unbranded").resolve()
    assert [] == check_sensitive_word(check_folder, "azure")
