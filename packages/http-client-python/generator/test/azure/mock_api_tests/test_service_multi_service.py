# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from service.multiservice import Combined
from service.multiservice.models import VersionsA


def test_service_multi_service_foo():
    client = Combined(endpoint="http://localhost:3000")
    client.foo.test()


def test_service_multi_service_bar():
    client = Combined(endpoint="http://localhost:3000")
    client.bar.test()
