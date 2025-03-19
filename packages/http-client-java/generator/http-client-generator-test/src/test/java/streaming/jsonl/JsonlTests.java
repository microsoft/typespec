// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package streaming.jsonl;

import com.azure.core.util.BinaryData;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class JsonlTests {

    private final JsonlClient client = new JsonlClientBuilder().buildClient();

    @Test
    public void testJsonl() {
        String jsonlStream = List.of("{\"desc\": \"one\"}", "{\"desc\": \"two\"}", "{\"desc\": \"three\"}")
            .stream()
            .collect(Collectors.joining("\n"));
        client.send(BinaryData.fromString(jsonlStream));

        BinaryData data = client.receive();
        Assertions.assertEquals(3, data.toString().split("\n").length);
    }
}
