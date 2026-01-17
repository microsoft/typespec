// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package documentation;

import org.junit.jupiter.api.Test;

public class BulletPointsOpTests {

    private final ListsClient client = new DocumentationClientBuilder().buildListsClient();

    @Test
    public void testBulletPointsOp() {
        client.bulletPointsOp();
    }
}
