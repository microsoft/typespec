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
import tempfile
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
LOCK_FILE = Path(tempfile.gettempdir()) / "http_client_python_test_server.lock"
PID_FILE = Path(tempfile.gettempdir()) / "http_client_python_test_server.pid"


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
    """Start the tsp-spector mock API server.

    Always serves both azure-http-specs and http-specs regardless of flavor.
    This allows azure and unbranded tests to run in parallel using the same server.
    """
    azure_http_path = ROOT / "node_modules/@azure-tools/azure-http-specs"
    http_path = ROOT / "node_modules/@typespec/http-specs"

    # Always serve both spec sets so azure and unbranded tests can run in parallel
    # Use absolute paths with forward slashes (works on all platforms including Windows)
    cwd = azure_http_path.resolve()
    azure_specs = str(cwd / "specs").replace("\\", "/")
    http_specs = str((http_path / "specs").resolve()).replace("\\", "/")
    cmd = f"npx tsp-spector serve {azure_specs} {http_specs}"

    # Add node_modules/.bin to PATH
    env = os.environ.copy()
    node_bin = str(ROOT / "node_modules" / ".bin")
    env["PATH"] = f"{node_bin}{os.pathsep}{env.get('PATH', '')}"

    if os.name == "nt":
        return subprocess.Popen(cmd, shell=True, cwd=str(cwd), env=env)
    return subprocess.Popen(cmd, shell=True, cwd=str(cwd), env=env, preexec_fn=os.setsid)


def terminate_server_process(process):
    """Terminate the mock API server process."""
    if process is None:
        return
    try:
        if os.name == "nt":
            # On Windows, use taskkill to kill the entire process tree
            # process.kill() only kills the shell, not the child node process
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                capture_output=True,
                check=False,
            )
        else:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    except ProcessLookupError:
        pass  # Process already terminated
    except Exception:
        # Fallback: try basic kill
        try:
            process.kill()
        except Exception:
            pass


@pytest.fixture(scope="session", autouse=True)
def testserver():
    """Start the mock API server, coordinated across xdist workers via file lock.

    The first process to acquire the lock starts the server; others wait for it.
    The server is intentionally NOT killed in teardown — with xdist, the owning
    worker may finish before others, killing the server prematurely. The server
    is cleaned up when the tox/parent process exits.
    """
    # Check if server is already running
    if not wait_for_server(SERVER_URL, timeout=1, interval=0.1):
        lock = FileLock(str(LOCK_FILE), timeout=120)
        try:
            with lock:
                # Double-check after acquiring lock
                if not wait_for_server(SERVER_URL, timeout=1, interval=0.1):
                    server = start_server_process()
                    PID_FILE.write_text(str(server.pid))
                    if not wait_for_server(SERVER_URL, timeout=60):
                        terminate_server_process(server)
                        pytest.fail(f"Mock API server failed to start at {SERVER_URL}")
        except TimeoutError:
            if not wait_for_server(SERVER_URL, timeout=5):
                pytest.fail("Timeout waiting for server lock")

    # Final check that server is reachable
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
