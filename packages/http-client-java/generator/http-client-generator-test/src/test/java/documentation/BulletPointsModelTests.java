// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package documentation;

import documentation.lists.models.BulletPointsEnum;
import documentation.lists.models.BulletPointsModel;
import org.junit.jupiter.api.Test;

public class BulletPointsModelTests {

    private final ListsClient client = new DocumentationClientBuilder().buildListsClient();

    @Test
    public void testBulletPointsModel() {
        client.bulletPointsModel(new BulletPointsModel(BulletPointsEnum.SIMPLE));
    }
}
