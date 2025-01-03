# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import os
import subprocess
import signal
import pytest
import re
from pathlib import Path


def start_server_process():
    http_path = Path(os.path.dirname(__file__)) / Path("../../../../node_modules/@typespec/http-specs")
    os.chdir(http_path.resolve())
    cmd = "tsp-spector serve ./specs"
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
