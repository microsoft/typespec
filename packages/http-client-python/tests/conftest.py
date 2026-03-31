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

# Root of the http-client-python package
ROOT = Path(__file__).parent.parent
DATA_FOLDER = Path(__file__).parent / "mock_api" / "shared"


def start_server_process():
    """Start the tsp-spector mock API server."""
    azure_http_path = ROOT / "node_modules/@azure-tools/azure-http-specs"
    http_path = ROOT / "node_modules/@typespec/http-specs"

    # Determine flavor from environment or current directory
    flavor = os.environ.get("FLAVOR", "azure")

    if flavor == "unbranded":
        os.chdir(http_path.resolve())
        cmd = "npx tsp-spector serve ./specs"
    else:
        os.chdir(azure_http_path.resolve())
        cmd = f"npx tsp-spector serve ./specs {(http_path / 'specs').resolve()}"

    if os.name == "nt":
        return subprocess.Popen(cmd, shell=True)
    return subprocess.Popen(cmd, shell=True, preexec_fn=os.setsid)


def terminate_server_process(process):
    """Terminate the mock API server process."""
    if os.name == "nt":
        process.kill()
    else:
        try:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except ProcessLookupError:
            pass  # Process already terminated


@pytest.fixture(scope="session", autouse=True)
def testserver():
    """Start spector mock api tests."""
    server = start_server_process()
    yield
    terminate_server_process(server)


@pytest.fixture
def core_library():
    """Import the appropriate core library (azure.core or corehttp)."""
    try:
        return importlib.import_module("azure.core")
    except ModuleNotFoundError:
        return importlib.import_module("corehttp")


@pytest.fixture
def key_credential(core_library):
    """Get the appropriate credential class."""
    try:
        return core_library.credentials.AzureKeyCredential
    except AttributeError:
        return core_library.credentials.ServiceKeyCredential


@pytest.fixture
def png_data() -> bytes:
    """Load PNG test data."""
    with open(str(DATA_FOLDER / "data/image.png"), "rb") as file_in:
        return file_in.read()


@pytest.fixture
def jpg_data() -> bytes:
    """Load JPG test data."""
    with open(str(DATA_FOLDER / "data/image.jpg"), "rb") as file_in:
        return file_in.read()
