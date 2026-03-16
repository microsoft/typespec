// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package specialwords;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import specialwords.extensiblestrings.models.ExtensibleString;

public class ExtensibleStringsClientTest {

    private final ExtensibleStringsClient client = new SpecialWordsClientBuilder().buildExtensibleStringsClient();

    @Test
    public void testPutExtensibleStringValue() {
        ExtensibleString result = client.putExtensibleStringValue(ExtensibleString.CLASS);
        Assertions.assertEquals(ExtensibleString.CLASS, result);
    }
}
