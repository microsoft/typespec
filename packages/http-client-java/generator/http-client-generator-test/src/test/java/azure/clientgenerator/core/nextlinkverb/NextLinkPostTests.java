// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.nextlinkverb;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class NextLinkPostTests {

    private final NextLinkVerbClient client = new NextLinkVerbClientBuilder().buildClient();

    @Test
    public void testNextLinkPost() {
        Assertions.assertEquals(2, client.listItems().stream().count());
    }
}
