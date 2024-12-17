# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import os
import subprocess
import signal
import pytest
import importlib
from pathlib import Path
from typing import List

FILE_FOLDER = Path(__file__).parent


def start_server_process():
    azure_http_path = Path(os.path.dirname(__file__)) / Path("../../../../node_modules/@azure-tools/azure-http-specs")
    http_path = Path(os.path.dirname(__file__)) / Path("../../../../node_modules/@typespec/http-specs")
    os.chdir(azure_http_path.resolve())
    cmd = f"tsp-spector serve ./specs  {(http_path / 'specs').resolve()}"
    if os.name == "nt":
        return subprocess.Popen(cmd, shell=True)
    return subprocess.Popen(cmd, shell=True, preexec_fn=os.setsid)


def terminate_server_process(process):
    if os.name == "nt":
        process.kill()
    else:
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)  # Send the signal to all the process groups


@pytest.fixture(scope="session", autouse=True)
def testserver():
    """Start spector mock api tests"""
    server = start_server_process()
    yield
    terminate_server_process(server)


"""
Use to disambiguate the core library we use
"""


@pytest.fixture
def core_library():
    try:
        return importlib.import_module("azure.core")
    except ModuleNotFoundError:
        return importlib.import_module("corehttp")


@pytest.fixture
def key_credential(core_library):
    try:
        return core_library.credentials.AzureKeyCredential
    except AttributeError:
        return core_library.credentials.ServiceKeyCredential


SPECIAL_WORDS = [
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "class",
    "constructor",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "exec",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield",
]


@pytest.fixture
def special_words() -> List[str]:
    return SPECIAL_WORDS


@pytest.fixture
def png_data() -> bytes:
    with open(str(FILE_FOLDER / "data/image.png"), "rb") as file_in:
        return file_in.read()


@pytest.fixture
def jpg_data() -> bytes:
    with open(str(FILE_FOLDER / "data/image.jpg"), "rb") as file_in:
        return file_in.read()
