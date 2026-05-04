// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.versioning.previewversion;

import azure.versioning.previewversion.models.UpdateWidgetColorRequest;
import org.junit.jupiter.api.Test;

public class PreviewVersionTests {

    private static final String widgetId = "widget-123";

    @Test
    public void testPreviewClient() {
        PreviewVersionClient client = new PreviewVersionClientBuilder().buildClient();

        client.getWidget(widgetId);

        client.updateWidgetColor(widgetId, new UpdateWidgetColorRequest().setColor("red"));
    }

    @Test
    public void testStableClient() {
        PreviewVersionClient client
            = new PreviewVersionClientBuilder().serviceVersion(PreviewVersionServiceVersion.V2024_06_01).buildClient();

        client.listWidgets("test", null);
    }
}
