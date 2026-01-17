// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package documentation;

import org.junit.jupiter.api.Test;

public class BoldTextTests {

    private final TextFormattingClient client = new DocumentationClientBuilder().buildTextFormattingClient();

    @Test
    public void testBoldText() {
        client.boldText();
    }
}
