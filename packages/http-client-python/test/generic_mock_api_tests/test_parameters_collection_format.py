# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.collectionformat import CollectionFormatClient


@pytest.fixture
def client():
    with CollectionFormatClient() as client:
        yield client


def test_query_multi(client: CollectionFormatClient):
    client.query.multi(colors=["blue", "red", "green"])


def test_query_csv(client: CollectionFormatClient):
    client.query.csv(colors=["blue", "red", "green"])


def test_query_pipes(client: CollectionFormatClient):
    client.query.pipes(colors=["blue", "red", "green"])


def test_query_ssv(client: CollectionFormatClient):
    client.query.ssv(colors=["blue", "red", "green"])


def test_query_tsv(client: CollectionFormatClient):
    client.query.tsv(colors=["blue", "red", "green"])


def test_csv_header(client: CollectionFormatClient):
    client.header.csv(colors=["blue", "red", "green"])
