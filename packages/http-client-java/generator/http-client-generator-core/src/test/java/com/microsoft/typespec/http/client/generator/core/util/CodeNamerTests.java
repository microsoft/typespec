// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CodeNamerTests {

    @Test
    public void testEnumMemberName() {
        Assertions.assertEquals("NINE_NINE_ONE", CodeNamer.getEnumMemberName("991"));

        Assertions.assertEquals("TCP", CodeNamer.getEnumMemberName("tcp"));

        Assertions.assertEquals("WSDL_LINK", CodeNamer.getEnumMemberName("wsdl-link"));

        Assertions.assertEquals("CONTENT_TYPE", CodeNamer.getEnumMemberName("content_type"));

        Assertions.assertEquals("MICROSOFT_APP_CONFIGURATION_CONFIGURATION_STORES",
            CodeNamer.getEnumMemberName("Microsoft.AppConfiguration/configurationStores"));

        Assertions.assertEquals("ASTERISK", CodeNamer.getEnumMemberName("*"));

        Assertions.assertEquals("ALL", CodeNamer.getEnumMemberName("$all"));

        Assertions.assertEquals("ALL", CodeNamer.getEnumMemberName("all*"));

        Assertions.assertEquals("SYSTEM_ASSIGNED_USER_ASSIGNED",
            CodeNamer.getEnumMemberName("SystemAssigned, UserAssigned"));

        Assertions.assertEquals("ONE_ZEROMINUTELY", CodeNamer.getEnumMemberName("_10minutely"));

        Assertions.assertEquals("_", CodeNamer.getEnumMemberName("_"));
    }
}
