// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.array;

import encode.array.models.CommaDelimitedArrayProperty;
import encode.array.models.NewlineDelimitedArrayProperty;
import encode.array.models.PipeDelimitedArrayProperty;
import encode.array.models.SpaceDelimitedArrayProperty;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class EncodeArrayTests {

    private static final List<String> COLORS = List.of("blue", "red", "green");

    private final ArrayClient client = new ArrayClientBuilder().buildClient();

    @Test
    public void commaDelimitedProperty() {
        CommaDelimitedArrayProperty response = client.commaDelimited(new CommaDelimitedArrayProperty(COLORS));
        Assertions.assertEquals(COLORS, response.getValue());
    }

    @Test
    public void spaceDelimitedProperty() {
        SpaceDelimitedArrayProperty response = client.spaceDelimited(new SpaceDelimitedArrayProperty(COLORS));
        Assertions.assertEquals(COLORS, response.getValue());
    }

    @Test
    public void pipeDelimitedProperty() {
        PipeDelimitedArrayProperty response = client.pipeDelimited(new PipeDelimitedArrayProperty(COLORS));
        Assertions.assertEquals(COLORS, response.getValue());
    }

    @Test
    public void newlineDelimitedProperty() {
        NewlineDelimitedArrayProperty response = client.newlineDelimited(new NewlineDelimitedArrayProperty(COLORS));
        Assertions.assertEquals(COLORS, response.getValue());
    }
}
