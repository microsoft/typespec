# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.lro.operationid import OperationIdClient, models


@pytest.fixture
def client():
    with OperationIdClient() as client:
        yield client


def test_polling_uri_id_and_resume(client):
    initial = client.begin_analyze("document-1", polling=False)
    assert initial.operation_id == "analysis-123"
    assert initial.details == {"operation_id": "analysis-123"}
    poller = client.begin_analyze("document-1", polling_interval=0)
    assert poller.result() == models.DocumentAnalysisResult(summary="The document contains three sections.")
    resumed = client.begin_analyze("document-1", continuation_token=poller.continuation_token(), polling_interval=0)
    assert resumed.operation_id == "analysis-123"
    resumed.result()


@pytest.mark.parametrize("with_path", [False, True])
def test_monitor_body_id(client, with_path):
    begin = client.begin_start_translation_with_path if with_path else client.begin_start_translation
    initial = begin(polling=False)
    assert initial.operation_id == ("translation-456" if with_path else None)
    poller = begin(polling_interval=0)
    assert poller.result() == models.TranslationResult(translated_characters=84 if with_path else 42)
    assert poller.operation_id == ("translation-456" if with_path else "translation-123")
