# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from datetime import datetime, timezone

import pytest
from azure.core.exceptions import HttpResponseError
from specs.azure.clientgenerator.core.lro.metadata import MetadataClient, models


@pytest.fixture
def client():
    with MetadataClient() as client:
        yield client


def test_usage(client):
    poller = client.begin_analyze_with_usage("analyzer-1", polling_interval=0)
    assert poller.result() == models.ContentAnalysisResult(contents="The document contains three sections.")
    assert poller.details["usage"] == models.UsageDetails(document_pages_basic=1, tokens={"input": 10, "output": 4})


def test_job_initial_metadata(client):
    poller = client.begin_analyze_job(polling=False)
    assert poller.details["job_id"] == "job-success"
    assert poller.details["created_date_time"] == datetime(2025, 1, 1, 10, tzinfo=timezone.utc)
    assert "statistics" not in poller.details
    assert "errors" not in poller.details


@pytest.mark.parametrize("fails", [False, True])
def test_latest_job_metadata_including_failure(client, fails):
    begin = client.begin_analyze_job_with_failure if fails else client.begin_analyze_job
    poller = begin(polling_interval=0)
    if fails:
        with pytest.raises(HttpResponseError):
            poller.result()
    else:
        assert poller.result() == models.LanguageJobResult(documents=["document-1", "document-2", "document-3"])
    assert poller.details["statistics"] == models.JobStatistics(
        total=3, succeeded=1 if fails else 3, failed=2 if fails else 0
    )
    assert poller.details["last_updated_date_time"] == datetime(2025, 1, 1, 10, 2, tzinfo=timezone.utc)
    assert len(poller.details["errors"]) == (2 if fails else 0)
    assert "error" not in poller.details


def test_metadata_repopulates_after_resume(client):
    poller = client.begin_analyze_job(polling_interval=0)
    poller.result()
    resumed = client.begin_analyze_job(continuation_token=poller.continuation_token(), polling_interval=0)
    resumed.result()
    assert resumed.details["statistics"] == models.JobStatistics(total=3, succeeded=3, failed=0)
