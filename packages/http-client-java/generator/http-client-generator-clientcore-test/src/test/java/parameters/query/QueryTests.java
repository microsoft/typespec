// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.query;

import org.junit.jupiter.api.Test;

public class QueryTests {

    private final ConstantClient constantClient = new QueryClientBuilder().buildConstantClient();
    private final SpecialCharClient specialCharClient = new QueryClientBuilder().buildSpecialCharClient();

    @Test
    public void testConstant() {
        constantClient.post();
    }

    @Test
    public void testDollarSign() {
        specialCharClient.dollarSign("status eq 'active'");
    }
}
