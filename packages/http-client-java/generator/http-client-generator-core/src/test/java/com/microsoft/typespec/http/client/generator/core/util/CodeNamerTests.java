// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CodeNamerTests {

    @Test
    public void testEnumMemberName() {
        // numbers to words
        Assertions.assertEquals("NINE_NINE_ONE", CodeNamer.getEnumMemberName("991"));

        Assertions.assertEquals("TCP", CodeNamer.getEnumMemberName("tcp"));

        Assertions.assertEquals("WSDL_LINK", CodeNamer.getEnumMemberName("wsdl-link"));

        Assertions.assertEquals("CONTENT_TYPE", CodeNamer.getEnumMemberName("content_type"));

        // unicode letter
        Assertions.assertEquals("Ā" + "ALL" + "Ā", CodeNamer.getEnumMemberName("\u0100all\u0101"));

        // special characters removed
        Assertions.assertEquals("MICROSOFT_APP_CONFIGURATION_CONFIGURATION_STORES",
            CodeNamer.getEnumMemberName("Microsoft.AppConfiguration/configurationStores"));

        Assertions.assertEquals("SYSTEM_ASSIGNED_USER_ASSIGNED",
            CodeNamer.getEnumMemberName("SystemAssigned, UserAssigned"));

        Assertions.assertEquals("ALL", CodeNamer.getEnumMemberName("$all"));
        Assertions.assertEquals("ALL", CodeNamer.getEnumMemberName("all*"));

        // contains only special characters
        Assertions.assertEquals("ASTERISK", CodeNamer.getEnumMemberName("*"));

        Assertions.assertEquals("COLON", CodeNamer.getEnumMemberName("__:"));

        // underscore alone cannot be variable name
        Assertions.assertEquals("UNDERSCORE", CodeNamer.getEnumMemberName("_"));
        Assertions.assertEquals("UNDERSCORE", CodeNamer.getEnumMemberName("___"));

        // underscore removed, and numbers to words
        Assertions.assertEquals("ONE_ZEROMINUTELY", CodeNamer.getEnumMemberName("_10minutely"));

        // special characters removed, and numbers to words
        Assertions.assertEquals("ONE_ZERO_ZERO_GIFT_CARD", CodeNamer.getEnumMemberName("$100 Gift Card"));
        Assertions.assertEquals("ONE_ZERO_ZERO_GIFT_CARD", CodeNamer.getEnumMemberName("$$100 Gift Card"));
    }
}
