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

# Global server process reference (used by hooks)
_server_process = None
_owns_server = False  # Track if this process started the server


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

    # Add node_modules/.bin to PATH
    env = os.environ.copy()
    node_bin = str(ROOT / "node_modules" / ".bin")
    env["PATH"] = f"{node_bin}{os.pathsep}{env.get('PATH', '')}"

    # Suppress server stdout/stderr to avoid confusing "Request validation failed" warnings
    # in test output. Server readiness is validated via HTTP polling in wait_for_server().
    if os.name == "nt":
        return subprocess.Popen(cmd, shell=True, cwd=str(cwd), env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return subprocess.Popen(cmd, shell=True, cwd=str(cwd), env=env, preexec_fn=os.setsid, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


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


def pytest_configure(config):
    """Start the mock server before any tests run.

    Uses file locking to ensure only one process starts the server,
    even when running with pytest-xdist. The controller process starts
    the server and workers wait for it to be ready.
    """
    global _server_process, _owns_server

    # Check if server is already running (e.g., from a previous run or external process)
    if wait_for_server(SERVER_URL, timeout=1, interval=0.1):
        print(f"Mock API server already running at {SERVER_URL}")
        return

    # Use file lock to ensure only one process starts the server
    # This handles both xdist workers and multiple test runs
    lock = FileLock(str(LOCK_FILE), timeout=120)

    try:
        with lock:
            # Double-check after acquiring lock (another process may have started it)
            if wait_for_server(SERVER_URL, timeout=1, interval=0.1):
                print(f"Mock API server already running at {SERVER_URL}")
                return

            # We're the first process - start the server
            print(f"Starting mock API server...")
            _server_process = start_server_process()
            _owns_server = True

            # Check if process started successfully
            if _server_process.poll() is not None:
                pytest.exit(f"Mock API server process exited immediately with code {_server_process.returncode}")

            # Write PID file so other processes know who owns the server
            PID_FILE.write_text(str(_server_process.pid))

            # Wait for server to be ready
            if not wait_for_server(SERVER_URL, timeout=60):
                if _server_process.poll() is not None:
                    pytest.exit(f"Mock API server process died with code {_server_process.returncode}")
                terminate_server_process(_server_process)
                _server_process = None
                _owns_server = False
                pytest.exit(f"Mock API server failed to start within 60 seconds at {SERVER_URL}")

            print(f"Mock API server ready at {SERVER_URL}")

    except TimeoutError:
        # Another process is holding the lock for too long
        # Check if server is available anyway
        if wait_for_server(SERVER_URL, timeout=5):
            print(f"Mock API server available at {SERVER_URL} (started by another process)")
        else:
            pytest.exit("Timeout waiting for server lock - another process may be stuck")


def pytest_unconfigure(config):
    """Stop the mock server after all tests complete."""
    global _server_process, _owns_server

    # Only stop the server if this process started it
    if not _owns_server:
        return

    terminate_server_process(_server_process)
    _server_process = None
    _owns_server = False

    # Clean up PID file
    try:
        PID_FILE.unlink(missing_ok=True)
    except Exception:
        pass


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
