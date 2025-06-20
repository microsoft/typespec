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

    @Test
    public void testEscapeComment() {
        Assertions.assertEquals("doc has no comment", CodeNamer.escapeComment("doc has no comment"));
        Assertions.assertEquals("doc*&#47;has comment", CodeNamer.escapeComment("doc*/has comment"));
        Assertions.assertEquals("doc*&#47;has*&#47;comment", CodeNamer.escapeComment("doc*/has*/comment"));
    }

    @Test
    public void testEscapeIllegalUnicodeEscape() {
        // simple cases
        Assertions.assertEquals("domain{@code \\}username", CodeNamer.escapeIllegalUnicodeEscape("domain\\username"));

        // invalid hex
        Assertions.assertEquals("{@code \\}u004=", CodeNamer.escapeIllegalUnicodeEscape("\\u004="));
        // incomplete unicode escape (less than 4 hex digits)
        Assertions.assertEquals("{@code \\}u41", CodeNamer.escapeIllegalUnicodeEscape("\\u41"));
        // incomplete unicode escape (\\u at end of string)
        Assertions.assertEquals("data{@code \\}u", CodeNamer.escapeIllegalUnicodeEscape("data\\u"));

        // already escaped
        Assertions.assertEquals("domain\\\\username", CodeNamer.escapeIllegalUnicodeEscape("domain\\\\username"));
        Assertions.assertEquals("\\\\username", CodeNamer.escapeIllegalUnicodeEscape("\\\\username"));

        // valid unicode escape
        Assertions.assertEquals("\\u0041", CodeNamer.escapeIllegalUnicodeEscape("\\u0041"));
        Assertions.assertEquals("\\u00af", CodeNamer.escapeIllegalUnicodeEscape("\\u00af"));
        Assertions.assertEquals("\\u00AF", CodeNamer.escapeIllegalUnicodeEscape("\\u00AF"));
        Assertions.assertEquals("data\\u0041item", CodeNamer.escapeIllegalUnicodeEscape("data\\u0041item"));

        // multiple/mixed cases
        Assertions.assertEquals("domain{@code \\}username{@code \\}unicode",
            CodeNamer.escapeIllegalUnicodeEscape("domain\\username\\unicode"));
        Assertions.assertEquals("domain\\\\username{@code \\}unicode",
            CodeNamer.escapeIllegalUnicodeEscape("domain\\\\username\\unicode"));
        Assertions.assertEquals("domain{@code \\}username\\u0041code",
            CodeNamer.escapeIllegalUnicodeEscape("domain\\username\\u0041code"));
        Assertions.assertEquals("domain\\\\username\\u00AF{@code \\}unicode",
            CodeNamer.escapeIllegalUnicodeEscape("domain\\\\username\\u00AF\\unicode"));
        Assertions.assertEquals("domain{@code \\}username\\u00AF{@code \\}unicode",
            CodeNamer.escapeIllegalUnicodeEscape("domain\\username\\u00AF\\unicode"));
    }
}
