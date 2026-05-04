// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.query;

import org.junit.jupiter.api.Test;

public class QueryTests {

    private final QueryClient client = new QueryClientBuilder().buildClient();

    @Test
    public void testConstant() {
        client.post();
    }
}
