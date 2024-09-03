// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.builtin;

import com.azure.core.util.BinaryData;
import com.cadl.builtin.models.Encoded;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;

public class EncodeTests {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final OffsetDateTime DATE = OffsetDateTime.parse("2019-10-12T07:20:50.52Z");
    private static final byte[] DATA = "data".getBytes(StandardCharsets.UTF_8);

    @Test
    public void testEncoded() throws Exception {
        Duration timeInSeconds = Duration.ofSeconds(5);
        Duration timeInSecondsFraction = Duration.ofMillis(1500);

        Encoded encoded = new Encoded();
        encoded.setTimeInSeconds(timeInSeconds);
        encoded.setTimeInSecondsFraction(timeInSecondsFraction);
        encoded.setDateTime(DATE);
        encoded.setDateTimeRfc7231(DATE);
        encoded.setUnixTimestamp(DATE);
        encoded.setBase64(DATA);
        encoded.setBase64url(DATA);

        Assertions.assertEquals(timeInSeconds, encoded.getTimeInSeconds());
        Assertions.assertEquals(timeInSecondsFraction, encoded.getTimeInSecondsFraction());

        BinaryData json = BinaryData.fromObject(encoded);

        JsonNode jsonNode = OBJECT_MAPPER.readTree(json.toString());
        double timeInSecondsInJson = jsonNode.get("timeInSeconds").asDouble();
        double timeInSecondsFractionInJson = jsonNode.get("timeInSecondsFraction").asDouble();
        Assertions.assertEquals(5, timeInSecondsInJson);
        Assertions.assertEquals(1.5, timeInSecondsFractionInJson);
        Assertions.assertEquals(DATE, OffsetDateTime.parse(jsonNode.get("dateTime").asText()));
        Assertions.assertEquals("Sat, 12 Oct 2019 07:20:50 GMT", jsonNode.get("dateTimeRfc7231").asText());
        Assertions.assertEquals(1570864850L, jsonNode.get("unixTimestamp").asLong());
        Assertions.assertEquals("ZGF0YQ==", jsonNode.get("base64").asText());
        Assertions.assertEquals("ZGF0YQ", jsonNode.get("base64url").asText());

        String jsonStr = jsonNode.toString();
        Encoded encoded2 = BinaryData.fromString(jsonStr).toObject(Encoded.class);
        Assertions.assertEquals(timeInSeconds, encoded2.getTimeInSeconds());
        Assertions.assertEquals(timeInSecondsFraction, encoded2.getTimeInSecondsFraction());
        Assertions.assertEquals(DATE, encoded2.getDateTime());
        Assertions.assertEquals(DATE.withNano(0), encoded2.getDateTimeRfc7231());    // correct to seconds
        Assertions.assertEquals(DATE.withNano(0), encoded2.getUnixTimestamp());      // correct to seconds
        Assertions.assertArrayEquals(DATA, encoded2.getBase64());
        Assertions.assertArrayEquals(DATA, encoded2.getBase64url());
    }

    @Test
    public void testEncodedDurationInvalidPrecision() {
        Duration timeInSeconds = Duration.ofMillis(5700);

        Encoded encoded = new Encoded();
        encoded.setTimeInSeconds(timeInSeconds);

        // since the wire type is long (in seconds), 5.7 seconds will be 5 seconds
        Assertions.assertEquals(5, encoded.getTimeInSeconds().getSeconds());
    }
}
