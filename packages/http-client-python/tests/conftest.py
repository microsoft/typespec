# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import os
import subprocess
import signal
import time
import urllib.request
import urllib.error
import pytest
import importlib
from pathlib import Path

# Root of the http-client-python package
ROOT = Path(__file__).parent.parent
DATA_FOLDER = Path(__file__).parent / "mock_api" / "shared"

# Server configuration
SERVER_HOST = "localhost"
SERVER_PORT = 3000
SERVER_URL = f"http://{SERVER_HOST}:{SERVER_PORT}"

# Global server process reference (used by hooks)
_server_process = None


def wait_for_server(url: str, timeout: int = 60, interval: float = 0.5) -> bool:
    """Wait for the server to be ready by polling the URL."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            urllib.request.urlopen(url, timeout=1)
            return True
        except urllib.error.HTTPError:
            # Server is up but returned an error (e.g., 404) - that's fine
            return True
        except (urllib.error.URLError, OSError):
            # Server not reachable yet
            time.sleep(interval)
    return False


def start_server_process():
    """Start the tsp-spector mock API server."""
    azure_http_path = ROOT / "node_modules/@azure-tools/azure-http-specs"
    http_path = ROOT / "node_modules/@typespec/http-specs"

    # Determine flavor from environment or current directory
    flavor = os.environ.get("FLAVOR", "azure")

    # Use absolute paths with forward slashes (works on all platforms including Windows)
    if flavor == "unbranded":
        cwd = http_path.resolve()
        specs_path = str(cwd / "specs").replace("\\", "/")
        cmd = f"npx tsp-spector serve {specs_path}"
    else:
        cwd = azure_http_path.resolve()
        azure_specs = str(cwd / "specs").replace("\\", "/")
        http_specs = str((http_path / "specs").resolve()).replace("\\", "/")
        cmd = f"npx tsp-spector serve {azure_specs} {http_specs}"

    if os.name == "nt":
        return subprocess.Popen(cmd, shell=True, cwd=str(cwd))
    return subprocess.Popen(cmd, shell=True, preexec_fn=os.setsid, cwd=str(cwd))


def terminate_server_process(process):
    """Terminate the mock API server process."""
    if process is None:
        return
    if os.name == "nt":
        process.kill()
    else:
        try:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except ProcessLookupError:
            pass  # Process already terminated


def pytest_configure(config):
    """Start the mock server before any tests run.

    This hook runs in the controller process before workers are spawned,
    ensuring the server is ready for all workers.
    """
    global _server_process

    # Only start server in the controller process (not in workers)
    if hasattr(config, "workerinput"):
        return

    # Check if server is already running (e.g., from a previous run)
    if wait_for_server(SERVER_URL, timeout=1, interval=0.1):
        print(f"Mock API server already running at {SERVER_URL}")
        return

    # Start the server
    print(f"Starting mock API server...")
    _server_process = start_server_process()

    # Check if process started successfully
    if _server_process.poll() is not None:
        pytest.exit(f"Mock API server process exited immediately with code {_server_process.returncode}")

    # Wait for server to be ready
    if not wait_for_server(SERVER_URL, timeout=60):
        # Check if process is still running
        if _server_process.poll() is not None:
            pytest.exit(f"Mock API server process died with code {_server_process.returncode}")
        terminate_server_process(_server_process)
        _server_process = None
        pytest.exit(f"Mock API server failed to start within 60 seconds at {SERVER_URL}")

    print(f"Mock API server ready at {SERVER_URL}")


def pytest_unconfigure(config):
    """Stop the mock server after all tests complete."""
    global _server_process

    # Only stop server in the controller process
    if hasattr(config, "workerinput"):
        return

    terminate_server_process(_server_process)
    _server_process = None


@pytest.fixture(scope="session", autouse=True)
def testserver(request):
    """Ensure the mock server is ready before tests run.

    The server is started in pytest_configure (controller process).
    This fixture just verifies the server is accessible from workers.
    """
    if not wait_for_server(SERVER_URL, timeout=30):
        pytest.fail(f"Mock API server not available at {SERVER_URL}")
    yield


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
