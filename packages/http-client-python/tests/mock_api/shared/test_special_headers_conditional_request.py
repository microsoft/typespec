# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import datetime
from specialheaders.conditionalrequest import ConditionalRequestClient


@pytest.fixture
def client():
    with ConditionalRequestClient() as client:
        yield client


def test_post_if_match(core_library, client: ConditionalRequestClient):
    client.post_if_match(etag="valid", match_condition=core_library.MatchConditions.IfNotModified)


def test_post_if_none_match(core_library, client: ConditionalRequestClient):
    client.post_if_none_match(etag="invalid", match_condition=core_library.MatchConditions.IfModified)


def test_head_if_modified_since(client: ConditionalRequestClient):
    client.head_if_modified_since(
        if_modified_since=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc)
    )


def test_post_if_unmodified_since(client: ConditionalRequestClient):
    client.post_if_unmodified_since(
        if_unmodified_since=datetime.datetime(2022, 8, 26, 14, 38, 0, tzinfo=datetime.timezone.utc)
    )
