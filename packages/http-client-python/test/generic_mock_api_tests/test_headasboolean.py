# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from headasbooleantrue import VisibilityClient as HeadAsBooleanTrueClient
from headasbooleantrue import models as models_true

from headasbooleanfalse import VisibilityClient as HeadAsBooleanFalseClient
from headasbooleanfalse import models as models_false


@pytest.fixture
def client_true():
    with HeadAsBooleanTrueClient() as client:
        yield client


@pytest.fixture
def client_false():
    with HeadAsBooleanFalseClient() as client:
        yield client


def test_head_true(client_true):
    body = models_true.VisibilityModel(query_prop=123)
    assert client_true.head_model(body) == True


def test_head_false(client_false):
    body = models_false.VisibilityModel(query_prop=123)
    assert client_false.head_model(body) is None
