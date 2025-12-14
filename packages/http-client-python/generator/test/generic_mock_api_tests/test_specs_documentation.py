# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import pytest
from specs.documentation import DocumentationClient, models


@pytest.fixture
def client():
    with DocumentationClient(endpoint="http://localhost:3000") as client:
        yield client


class TestLists:
    def test_bullet_points_op(self, client: DocumentationClient):
        # GET /documentation/lists/bullet-points/op
        # Expected: 204 No Content
        client.lists.bullet_points_op()

    @pytest.mark.skip(reason="https://github.com/microsoft/typespec/issues/9173")
    def test_bullet_points_model(self, client: DocumentationClient):
        # POST /documentation/lists/bullet-points/model
        # Expected: 200 OK
        client.lists.bullet_points_model(input=models.BulletPointsModel(prop="Simple"))

        # Also test with JSON
        client.lists.bullet_points_model(body={"input": {"prop": "Simple"}})

    def test_numbered(self, client: DocumentationClient):
        # GET /documentation/lists/numbered
        # Expected: 204 No Content
        client.lists.numbered()


class TestTextFormatting:
    def test_bold_text(self, client: DocumentationClient):
        # GET /documentation/text-formatting/bold
        # Expected: 204 No Content
        client.text_formatting.bold_text()

    def test_italic_text(self, client: DocumentationClient):
        # GET /documentation/text-formatting/italic
        # Expected: 204 No Content
        client.text_formatting.italic_text()

    def test_combined_formatting(self, client: DocumentationClient):
        # GET /documentation/text-formatting/combined
        # Expected: 204 No Content
        client.text_formatting.combined_formatting()
