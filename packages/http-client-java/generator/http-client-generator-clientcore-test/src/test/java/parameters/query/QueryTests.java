// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.query;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class QueryTests {

    private final ConstantClient constantClient = new QueryClientBuilder().buildConstantClient();
    private final SpecialCharClient specialCharClient = new QueryClientBuilder().buildSpecialCharClient();

    @Test
    public void testConstant() {
        constantClient.post();
    }

    @Test
    @Disabled("Blocked until @typespec/http-specs publishes the dollar-sign route fix")
    public void testDollarSign() {
        specialCharClient.dollarSign("status eq 'active'");
    }
}
