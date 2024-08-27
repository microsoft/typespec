// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.builtin.generated;

import com.cadl.builtin.models.Builtin;
import com.cadl.builtin.models.Encoded;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled
public final class BuiltinOpReadTests extends BuiltinClientTestBase {
    @Test
    @Disabled
    public void testBuiltinOpReadTests() {
        // method invocation
        Builtin response = builtinClient.read(null, null, null, "myFilter", null, null);

        // response assertion
        Assertions.assertNotNull(response);
        // verify property "booleanProperty"
        Assertions.assertEquals(true, response.isBooleanProperty());
        // verify property "string"
        Assertions.assertEquals("myString", response.getString());
        // verify property "safeint"
        Assertions.assertEquals(32L, response.getSafeint());
        // verify property "longProperty"
        Assertions.assertEquals(64L, response.getLongProperty());
        // verify property "floatProperty"
        Assertions.assertEquals(32.0, response.getFloatProperty());
        // verify property "doubleProperty"
        Assertions.assertEquals(64.0, response.getDoubleProperty());
        // verify property "duration"
        Assertions.assertNotNull(response.getDuration());
        // verify property "date"
        Assertions.assertNotNull(response.getDate());
        // verify property "dateTime"
        Assertions.assertNotNull(response.getDateTime());
        // verify property "stringList"
        List<String> responseStringList = response.getStringList();
        Assertions.assertEquals("a", responseStringList.iterator().next());
        // verify property "url"
        Assertions.assertEquals("https://www.github.com", response.getUrl());
        // verify property "nullableFloatDict"
        Assertions.assertNotNull(response.getNullableFloatDict());
        // verify property "encoded"
        Encoded responseEncoded = response.getEncoded();
        Assertions.assertNotNull(responseEncoded);
        Assertions.assertNotNull(responseEncoded.getTimeInSeconds());
        Assertions.assertNotNull(responseEncoded.getTimeInSecondsFraction());
        Assertions.assertNotNull(responseEncoded.getDateTime());
        Assertions.assertNotNull(responseEncoded.getDateTimeRfc7231());
        Assertions.assertNotNull(responseEncoded.getUnixTimestamp());
        Assertions.assertNotNull(responseEncoded.getBase64());
        Assertions.assertNotNull(responseEncoded.getBase64url());
    }
}
