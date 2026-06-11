// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.bodyroot;

import org.junit.jupiter.api.Test;
import parameters.bodyroot.models.BodyRootModel;

public class BodyRootTests {

    private final BodyRootClient client = new BodyRootClientBuilder().buildClient();

    @Test
    public void testNested() {
        client.nested(new BodyRootModel().setCategory("widget").setLinkType("hard").setWasSuccessful(true));
    }
}
