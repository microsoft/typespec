# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.versioning.previewversion import PreviewVersionClient
from specs.azure.versioning.previewversion.models import UpdateWidgetColorRequest


@pytest.fixture
def client():
    with PreviewVersionClient() as client:
        yield client


@pytest.fixture
def stable_client():
    with PreviewVersionClient(api_version="2024-06-01") as client:
        yield client


def test_get_widget(client: PreviewVersionClient):
    result = client.get_widget(id="widget-123")
    assert result.id == "widget-123"
    assert result.name == "Sample Widget"
    assert result.color == "blue"


def test_update_widget_color(client: PreviewVersionClient):
    color_update = UpdateWidgetColorRequest(color="red")
    result = client.update_widget_color(id="widget-123", color_update=color_update)
    assert result.id == "widget-123"
    assert result.name == "Sample Widget"
    assert result.color == "red"
    
    with pytest.raises(ValueError):
        with PreviewVersionClient(api_version="2024-06-01") as stable_client:
            stable_client.update_widget_color(id="widget-123", color_update=color_update)


def test_list_widgets(stable_client: PreviewVersionClient):
    result = stable_client.list_widgets(name="test")
    assert len(result.widgets) == 1
    assert result.widgets[0].id == "widget-1"
    assert result.widgets[0].name == "test"
    
    with pytest.raises(ValueError):
        with PreviewVersionClient(api_version="2024-06-01") as client:
            client.list_widgets(name="test", color="test")
