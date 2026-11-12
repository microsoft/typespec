# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from azure.core.exceptions import HttpResponseError
from specs.azure.clientgenerator.core.lro.metadata import models
from specs.azure.clientgenerator.core.lro.metadata.aio import MetadataClient


@pytest_asyncio.fixture
async def client():
    async with MetadataClient() as client:
        yield client


@pytest.mark.asyncio
async def test_usage(client):
    poller = await client.begin_analyze_with_usage("analyzer-1", polling_interval=0)
    assert poller.details == {}
    await poller.polling_method().update_status()
    assert poller.details["usage"] == models.UsageDetails(document_pages_basic=1, tokens={"input": 10})
    assert await poller.result() == models.ContentAnalysisResult(contents="The document contains three sections.")
    assert poller.details["usage"].tokens == {"input": 10, "output": 4}


@pytest.mark.asyncio
@pytest.mark.parametrize("fails", [False, True])
async def test_latest_job_metadata_including_failure(client, fails):
    begin = client.begin_analyze_job_with_failure if fails else client.begin_analyze_job
    poller = await begin(polling_interval=0)
    assert poller.details["job_id"] == ("job-failure" if fails else "job-success")
    assert "statistics" not in poller.details
    assert "errors" not in poller.details
    await poller.polling_method().update_status()
    assert poller.details["statistics"] == models.JobStatistics(total=3, succeeded=1, failed=0)
    assert poller.details["last_updated_date_time"] == datetime(2025, 1, 1, 10, 1, tzinfo=timezone.utc)
    if fails:
        with pytest.raises(HttpResponseError):
            await poller.result()
    else:
        assert await poller.result() == models.LanguageJobResult(documents=["document-1", "document-2", "document-3"])
    assert poller.details["statistics"].failed == (2 if fails else 0)
    assert poller.details["last_updated_date_time"] == datetime(2025, 1, 1, 10, 2, tzinfo=timezone.utc)
    assert len(poller.details["errors"]) == (2 if fails else 0)
    assert "error" not in poller.details


@pytest.mark.asyncio
async def test_metadata_repopulates_after_resume(client):
    poller = await client.begin_analyze_job(polling_interval=0)
    await poller.polling_method().update_status()
    token = poller.continuation_token()
    resumed = await client.begin_analyze_job(continuation_token=token, polling_interval=0)
    assert resumed.details == {}
    await resumed.result()
    assert resumed.details["statistics"] == models.JobStatistics(total=3, succeeded=3, failed=0)
