# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import datetime

import pytest
from azure.core.exceptions import HttpResponseError
from specs.azure.clientgenerator.core.lro.metadata import MetadataClient, models


@pytest.fixture
def client():
    with MetadataClient() as client:
        yield client


def test_content_analysis_status(client: MetadataClient):
    status = client.get_content_analysis_status(operation_id="usage-123")

    assert status.usage.document_pages_basic == 1
    assert status.usage.tokens["input"] == 10


def test_analyze_with_usage(client: MetadataClient, polling_method):
    result = client.begin_analyze_with_usage(
        analyzer_id="analyzer-1", polling_interval=0, polling=polling_method
    ).result()

    assert result == models.ContentAnalysisResult(contents="The document contains three sections.")


def test_language_job_status(client: MetadataClient):
    status = client.get_language_job_status(job_id="job-success")

    assert status.job_id == "job-success"
    assert status.display_name == "Analyze documents"
    assert status.created_date_time == datetime.datetime(2025, 1, 1, 10, tzinfo=datetime.timezone.utc)
    assert status.expiration_date_time == datetime.datetime(2025, 1, 2, 10, tzinfo=datetime.timezone.utc)
    assert status.statistics.total == 3


def test_analyze_job(client: MetadataClient, polling_method):
    result = client.begin_analyze_job(polling_interval=0, polling=polling_method).result()

    assert result == models.LanguageJobResult(documents=["document-1", "document-2", "document-3"])


def test_analyze_job_with_failure(client: MetadataClient, polling_method):
    with pytest.raises(HttpResponseError):
        client.begin_analyze_job_with_failure(polling_interval=0, polling=polling_method).result()
