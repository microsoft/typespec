# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.core.model import ModelClient
from specs.azure.core.model.models import AzureEmbeddingModel


@pytest.fixture
def client():
    with ModelClient() as client:
        yield client


def test_azure_core_embedding_vector_post(client: ModelClient):
    embedding_model = AzureEmbeddingModel(embedding=[0, 1, 2, 3, 4])
    result = client.azure_core_embedding_vector.post(
        body=embedding_model,
    )
    assert result == AzureEmbeddingModel(embedding=[5, 6, 7, 8, 9])


def test_azure_core_embedding_vector_put(client: ModelClient):
    client.azure_core_embedding_vector.put(body=[0, 1, 2, 3, 4])


def test_azure_core_embedding_vector_get(client: ModelClient):
    assert [0, 1, 2, 3, 4] == client.azure_core_embedding_vector.get()
