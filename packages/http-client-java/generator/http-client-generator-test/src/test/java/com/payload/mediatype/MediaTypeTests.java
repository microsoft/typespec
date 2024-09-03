// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.payload.mediatype;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class MediaTypeTests {

    private final MediaTypeClient client = new MediaTypeClientBuilder()
            .buildClient();

    @Test
    public void test() {
        client.sendAsJson(client.getAsJson());

        String text = client.getAsText();
        Assertions.assertEquals("{cat}", text);
        client.sendAsText(text);
    }
}
