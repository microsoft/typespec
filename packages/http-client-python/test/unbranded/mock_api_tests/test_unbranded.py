# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
import os
import re
from subprocess import getoutput
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


def check_sensitive_word(folder: Path, word: str) -> str:
    special_folders = ["__pycache__", "pytest_cache"]
    if os.name == "nt":
        skip_folders = "|".join(special_folders)
        output = getoutput(
            f"powershell \"ls -r -Path {folder} | where fullname -notmatch '{skip_folders}' | Select-String -Pattern '{word}'\""
        ).replace("\\", "/")
    else:
        skip_folders = "{" + ",".join(special_folders) + "}"
        output = getoutput(f"grep -ri --exclude-dir={skip_folders} {word} {folder}")

    result = set()
    for item in re.findall(f"{folder.as_posix()}[^:]+", output.replace("\n", "")):
        result.add(Path(item).relative_to(folder).parts[0])
    return sorted(list(result))


def test_sensitive_word():
    check_folder = (Path(os.path.dirname(__file__)) / "../generated").resolve()
    assert [] == check_sensitive_word(check_folder, "azure")
    # after update cadl-ranch, it shall also equal to []
    assert ["authentication-oauth2", "authentication-union"] == check_sensitive_word(check_folder, "microsoft")
