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
from filelock import FileLock

# Root of the http-client-python package
ROOT = Path(__file__).parent.parent
DATA_FOLDER = Path(__file__).parent / "mock_api" / "shared"

# Server configuration
SERVER_HOST = "localhost"
SERVER_PORT = 3000
SERVER_URL = f"http://{SERVER_HOST}:{SERVER_PORT}"

# Lock file for coordinating server startup across xdist workers
LOCK_FILE = ROOT / "tests" / ".server.lock"
PID_FILE = ROOT / "tests" / ".server.pid"


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

    # Use absolute paths to avoid issues with cwd changes in parallel workers
    if flavor == "unbranded":
        cwd = http_path.resolve()
        cmd = f"npx tsp-spector serve {cwd / 'specs'}"
    else:
        cwd = azure_http_path.resolve()
        cmd = f"npx tsp-spector serve {cwd / 'specs'} {(http_path / 'specs').resolve()}"

    if os.name == "nt":
        return subprocess.Popen(cmd, shell=True, cwd=str(cwd))
    return subprocess.Popen(cmd, shell=True, preexec_fn=os.setsid, cwd=str(cwd))


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
def testserver(request):
    """Start spector mock api tests with xdist support.

    When running with pytest-xdist, only one worker starts the server.
    Other workers wait for the server to be ready.
    """
    # Check if running under xdist
    worker_id = getattr(request.config, "workerinput", {}).get("workerid", "master")
    is_xdist = hasattr(request.config, "workerinput")

    server = None

    if is_xdist:
        # Use file lock to coordinate server startup across workers
        with FileLock(str(LOCK_FILE)):
            if not wait_for_server(SERVER_URL, timeout=1, interval=0.1):
                # Server not running, we need to start it
                server = start_server_process()
                # Save PID so we know we're responsible for cleanup
                PID_FILE.write_text(str(server.pid))

                if not wait_for_server(SERVER_URL, timeout=60):
                    terminate_server_process(server)
                    pytest.fail(f"Mock API server failed to start within 60 seconds at {SERVER_URL}")

        # If we didn't start the server, wait for it to be ready
        if server is None:
            if not wait_for_server(SERVER_URL, timeout=60):
                pytest.fail(f"Mock API server not available at {SERVER_URL}")
    else:
        # Not running under xdist, use original behavior
        server = start_server_process()
        if not wait_for_server(SERVER_URL, timeout=60):
            terminate_server_process(server)
            pytest.fail(f"Mock API server failed to start within 60 seconds at {SERVER_URL}")

    yield

    # Only terminate if we started the server
    if server is not None:
        terminate_server_process(server)
        # Clean up PID file
        if PID_FILE.exists():
            PID_FILE.unlink()


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
