// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.xmlbytesverify;

import java.lang.reflect.Field;
import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Regression test for XML serializer gating.
 *
 * An operation whose response content-type is {@code application/xml} but whose body is raw {@code bytes} (not a
 * structured model) must NOT generate the static XML {@code ObjectSerializer SERIALIZER} field, because the
 * {@code XmlSerializerProviders} helper it references is only generated for models actually used in XML.
 */
public class XmlBytesVerifyTests {

    private static boolean hasSerializerField(Class<?> clazz) {
        return Arrays.stream(clazz.getDeclaredFields()).anyMatch(f -> "SERIALIZER".equals(f.getName()));
    }

    @Test
    public void noXmlSerializerFieldForBytesPayload() {
        Assertions.assertFalse(hasSerializerField(XmlBytesVerifyClient.class),
            "XmlBytesVerifyClient should not declare a static SERIALIZER field for a raw bytes XML payload.");
        Assertions.assertFalse(hasSerializerField(XmlBytesVerifyAsyncClient.class),
            "XmlBytesVerifyAsyncClient should not declare a static SERIALIZER field for a raw bytes XML payload.");
    }

    @Test
    public void xmlSerializerFieldPresentForModelPayload() throws ClassNotFoundException {
        // Positive control: a real XML model client does declare the SERIALIZER field, ensuring the reflection
        // check above is meaningful and would catch a regression that emits SERIALIZER unconditionally.
        Class<?> modelClient = Class.forName("payload.xml.SimpleModelValueClient");
        Field serializer = Arrays.stream(modelClient.getDeclaredFields())
            .filter(f -> "SERIALIZER".equals(f.getName()))
            .findFirst()
            .orElse(null);
        Assertions.assertNotNull(serializer, "payload.xml.SimpleModelValueClient should declare a SERIALIZER field.");
    }
}
