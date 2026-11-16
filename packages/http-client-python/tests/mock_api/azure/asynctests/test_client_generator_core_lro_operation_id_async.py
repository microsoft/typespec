# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.lro.operationid import models
from specs.azure.clientgenerator.core.lro.operationid.aio import OperationIdClient


@pytest_asyncio.fixture
async def client():
    async with OperationIdClient() as client:
        yield client


@pytest.mark.asyncio
async def test_polling_uri_id_and_resume(client):
    poller = await client.begin_analyze("document-1", polling_interval=0)
    assert poller.operation_id == "analysis-123"
    assert poller.details == {"operation_id": "analysis-123"}
    resumed = await client.begin_analyze(
        "document-1", continuation_token=poller.continuation_token(), polling_interval=0
    )
    assert resumed.operation_id == "analysis-123"
    assert await resumed.result() == models.DocumentAnalysisResult(summary="The document contains three sections.")


@pytest.mark.asyncio
@pytest.mark.parametrize("with_path", [False, True])
async def test_monitor_body_id(client, with_path):
    begin = client.begin_start_translation_with_path if with_path else client.begin_start_translation
    poller = await begin(polling_interval=0)
    assert poller.operation_id == ("translation-456" if with_path else None)
    await poller.polling_method().update_status()
    assert poller.operation_id == ("translation-456" if with_path else "translation-123")
    assert await poller.result() == models.TranslationResult(translated_characters=84 if with_path else 42)
