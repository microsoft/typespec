# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
from pygen.m2r import M2R


def test_inline_html():
    des = "Format: <MajorVersion>.<MinorVersion>.<Patch>"
    M2R.convert_to_rst(des) == r"Format: \ :code:`<MajorVersion>`.\ :code:`<MinorVersion>`.\ :code:`<Patch>`"
