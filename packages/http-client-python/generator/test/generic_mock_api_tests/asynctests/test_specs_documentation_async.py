# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import pytest
from specs.documentation.aio import DocumentationClient
from specs.documentation import models


@pytest.fixture
async def client():
    async with DocumentationClient(endpoint="http://localhost:3000") as client:
        yield client


class TestLists:
    @pytest.mark.asyncio
    async def test_bullet_points_op(self, client: DocumentationClient):
        # GET /documentation/lists/bullet-points/op
        # Expected: 204 No Content
        await client.lists.bullet_points_op()

    @pytest.mark.asyncio
    async def test_bullet_points_model(self, client: DocumentationClient):
        # POST /documentation/lists/bullet-points/model
        # Expected request body: {"input": {"prop": "Simple"}}
        # Expected: 200 OK
        await client.lists.bullet_points_model(input=models.BulletPointsModel(prop="Simple"))

        # Also test with JSON
        await client.lists.bullet_points_model(body={"input": {"prop": "Simple"}})

    @pytest.mark.asyncio
    async def test_numbered(self, client: DocumentationClient):
        # GET /documentation/lists/numbered
        # Expected: 204 No Content
        await client.lists.numbered()


class TestTextFormatting:
    @pytest.mark.asyncio
    async def test_bold_text(self, client: DocumentationClient):
        # GET /documentation/text-formatting/bold
        # Expected: 204 No Content
        await client.text_formatting.bold_text()

    @pytest.mark.asyncio
    async def test_italic_text(self, client: DocumentationClient):
        # GET /documentation/text-formatting/italic
        # Expected: 204 No Content
        await client.text_formatting.italic_text()

    @pytest.mark.asyncio
    async def test_combined_formatting(self, client: DocumentationClient):
        # GET /documentation/text-formatting/combined
        # Expected: 204 No Content
        await client.text_formatting.combined_formatting()
