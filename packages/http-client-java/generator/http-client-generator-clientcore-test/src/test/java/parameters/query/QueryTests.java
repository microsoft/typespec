// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.query;

import org.junit.jupiter.api.Test;

public class QueryTests {

    private final ConstantClient client = new QueryClientBuilder().buildConstantClient();

    @Test
    public void testConstant() {
        client.post();
    }
}
