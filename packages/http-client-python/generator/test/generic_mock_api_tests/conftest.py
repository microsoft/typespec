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

DATA_FOLDER = Path(__file__).parent.parent


def start_server_process():
    azure_http_path = Path(os.path.dirname(__file__)) / Path("../../../node_modules/@azure-tools/azure-http-specs")
    http_path = Path(os.path.dirname(__file__)) / Path("../../../node_modules/@typespec/http-specs")
    if "unbranded" in Path(os.getcwd()).parts:
        os.chdir(http_path.resolve())
        cmd = "npx tsp-spector serve ./specs"
    else:
        os.chdir(azure_http_path.resolve())
        cmd = f"npx tsp-spector serve ./specs {(http_path / 'specs').resolve()}"
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


@pytest.fixture
def png_data() -> bytes:
    with open(str(DATA_FOLDER / "data/image.png"), "rb") as file_in:
        return file_in.read()


@pytest.fixture
def jpg_data() -> bytes:
    with open(str(DATA_FOLDER / "data/image.jpg"), "rb") as file_in:
        return file_in.read()
