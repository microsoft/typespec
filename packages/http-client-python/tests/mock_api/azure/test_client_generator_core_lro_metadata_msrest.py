# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from datetime import datetime, timezone
from importlib import import_module
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

import pytest

pytestmark = pytest.mark.xdist_group(name="lro_metadata")


@pytest.fixture(scope="module")
def msrest_package():
    package_dir = (
        Path(__file__).parents[2]
        / "generated/azure/azure-client-generator-core-lro-metadata-msrest"
        / "specs/azure/clientgenerator/core/lro/metadata"
    )
    name = "_test_lro_metadata_msrest"
    spec = spec_from_file_location(name, package_dir / "__init__.py", submodule_search_locations=[str(package_dir)])
    assert spec is not None and spec.loader is not None
    package = module_from_spec(spec)
    sys.modules[name] = package
    spec.loader.exec_module(package)
    yield package
    for module_name in list(sys.modules):
        if module_name == name or module_name.startswith(name + "."):
            del sys.modules[module_name]


def test_msrest_monitor_deserialization(msrest_package):
    with msrest_package.MetadataClient() as client:
        initial = client.begin_analyze_job(polling=False)
        assert isinstance(initial, msrest_package.MetadataLROPoller)
        assert initial.details["job_id"] == "job-success"
        assert initial.details["created_date_time"] == datetime(2025, 1, 1, 10, tzinfo=timezone.utc)
        assert initial.details["statistics"] is None

        poller = client.begin_analyze_job(polling_interval=0)
        assert poller.result() == msrest_package.models.LanguageJobResult(
            documents=["document-1", "document-2", "document-3"]
        )
        assert poller.details["statistics"] == msrest_package.models.JobStatistics(total=3, succeeded=3, failed=0)


@pytest.mark.asyncio
async def test_async_msrest_monitor_deserialization(msrest_package):
    aio = import_module(msrest_package.__name__ + ".aio")
    async with aio.MetadataClient() as client:
        poller = await client.begin_analyze_job(polling_interval=0)
        assert isinstance(poller, aio.AsyncMetadataLROPoller)
        assert poller.details["statistics"] is None
        await poller.polling_method().update_status()
        assert poller.details["statistics"] == msrest_package.models.JobStatistics(total=3, succeeded=1, failed=0)
        await poller.result()
        assert poller.details["statistics"] == msrest_package.models.JobStatistics(total=3, succeeded=3, failed=0)
