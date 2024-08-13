# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.resourcemanager.models.resources.aio import ResourcesClient

SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000"
RESOURCE_GROUP_NAME = "test-rg"


@pytest.mark.asyncio
async def test_client_signature(credential, authentication_policy):
    # make sure signautre order is correct
    client1 = ResourcesClient(
        credential, SUBSCRIPTION_ID, "http://localhost:3000", authentication_policy=authentication_policy
    )
    # make sure signautre name is correct
    client2 = ResourcesClient(
        credential=credential,
        subscription_id=SUBSCRIPTION_ID,
        base_url="http://localhost:3000",
        authentication_policy=authentication_policy,
    )
    for client in [client1, client2]:
        # make sure signautre order is correct
        await client.top_level_tracked_resources.get(RESOURCE_GROUP_NAME, "top")
        # make sure signautre name is correct
        await client.top_level_tracked_resources.get(
            resource_group_name=RESOURCE_GROUP_NAME, top_level_tracked_resource_name="top"
        )
