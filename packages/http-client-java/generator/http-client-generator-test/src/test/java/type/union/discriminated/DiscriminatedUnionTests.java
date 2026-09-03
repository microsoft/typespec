// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.union.discriminated;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("Design not ready. The BinaryData based type is not a user-friendly design.")
public class DiscriminatedUnionTests {

    private final EnvelopeObjectDefaultClient envelopeDefaultClient
        = new DiscriminatedClientBuilder().buildEnvelopeObjectDefaultClient();
    private final EnvelopeObjectCustomPropertiesClient envelopeCustomClient
        = new DiscriminatedClientBuilder().buildEnvelopeObjectCustomPropertiesClient();
    private final NoEnvelopeDefaultClient noEnvelopeDefaultClient
        = new DiscriminatedClientBuilder().buildNoEnvelopeDefaultClient();
    private final NoEnvelopeCustomDiscriminatorClient noEnvelopeCustomClient
        = new DiscriminatedClientBuilder().buildNoEnvelopeCustomDiscriminatorClient();

    @Test
    public void testEnvelopeObjectDefaultGet() {
        BinaryData result = envelopeDefaultClient.get();
        Assertions.assertNotNull(result);
        String json = result.toString();
        Assertions.assertTrue(json.contains("\"kind\""));
        Assertions.assertTrue(json.contains("\"value\""));
    }

    @Test
    public void testEnvelopeObjectDefaultPut() {
        BinaryData input = BinaryData.fromString("{\"kind\":\"cat\",\"value\":{\"name\":\"Whiskers\",\"meow\":true}}");
        BinaryData result = envelopeDefaultClient.put(input);
        Assertions.assertNotNull(result);
    }

    @Test
    public void testEnvelopeObjectCustomPropertiesGet() {
        BinaryData result = envelopeCustomClient.get();
        Assertions.assertNotNull(result);
        String json = result.toString();
        Assertions.assertTrue(json.contains("\"petType\""));
        Assertions.assertTrue(json.contains("\"petData\""));
    }

    @Test
    public void testEnvelopeObjectCustomPropertiesPut() {
        BinaryData input
            = BinaryData.fromString("{\"petType\":\"cat\",\"petData\":{\"name\":\"Whiskers\",\"meow\":true}}");
        BinaryData result = envelopeCustomClient.put(input);
        Assertions.assertNotNull(result);
    }

    @Test
    public void testNoEnvelopeDefaultGet() {
        BinaryData result = noEnvelopeDefaultClient.get();
        Assertions.assertNotNull(result);
        String json = result.toString();
        Assertions.assertTrue(json.contains("\"kind\""));
        Assertions.assertTrue(json.contains("\"name\""));
    }

    @Test
    public void testNoEnvelopeDefaultPut() {
        BinaryData input = BinaryData.fromString("{\"kind\":\"cat\",\"name\":\"Whiskers\",\"meow\":true}");
        BinaryData result = noEnvelopeDefaultClient.put(input);
        Assertions.assertNotNull(result);
    }

    @Test
    public void testNoEnvelopeCustomDiscriminatorGet() {
        BinaryData result = noEnvelopeCustomClient.get();
        Assertions.assertNotNull(result);
        String json = result.toString();
        Assertions.assertTrue(json.contains("\"type\""));
        Assertions.assertTrue(json.contains("\"name\""));
    }

    @Test
    public void testNoEnvelopeCustomDiscriminatorPut() {
        BinaryData input = BinaryData.fromString("{\"type\":\"cat\",\"name\":\"Whiskers\",\"meow\":true}");
        BinaryData result = noEnvelopeCustomClient.put(input);
        Assertions.assertNotNull(result);
    }
}
