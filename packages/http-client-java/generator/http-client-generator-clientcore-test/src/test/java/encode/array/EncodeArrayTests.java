// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.array;

import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class EncodeArrayTests {

    private static final List<String> COLORS = List.of("blue", "red", "green");
    private static final List<Colors> ENUM_COLORS = List.of(Colors.BLUE, Colors.RED, Colors.GREEN);
    private static final List<ColorsExtensibleEnum> EXTENSIBLE_ENUM_COLORS
        = List.of(ColorsExtensibleEnum.BLUE, ColorsExtensibleEnum.RED, ColorsExtensibleEnum.GREEN);

    private final ArrayClient client = new ArrayClientBuilder().buildArrayClient();

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

    @Test
    public void enumCommaDelimitedProperty() {
        CommaDelimitedEnumArrayProperty response
            = client.enumCommaDelimited(new CommaDelimitedEnumArrayProperty(ENUM_COLORS));
        Assertions.assertEquals(ENUM_COLORS, response.getValue());
    }

    @Test
    public void enumSpaceDelimitedProperty() {
        SpaceDelimitedEnumArrayProperty response
            = client.enumSpaceDelimited(new SpaceDelimitedEnumArrayProperty(ENUM_COLORS));
        Assertions.assertEquals(ENUM_COLORS, response.getValue());
    }

    @Test
    public void enumPipeDelimitedProperty() {
        PipeDelimitedEnumArrayProperty response
            = client.enumPipeDelimited(new PipeDelimitedEnumArrayProperty(ENUM_COLORS));
        Assertions.assertEquals(ENUM_COLORS, response.getValue());
    }

    @Test
    public void enumNewlineDelimitedProperty() {
        NewlineDelimitedEnumArrayProperty response
            = client.enumNewlineDelimited(new NewlineDelimitedEnumArrayProperty(ENUM_COLORS));
        Assertions.assertEquals(ENUM_COLORS, response.getValue());
    }

    @Test
    public void extensibleEnumCommaDelimitedProperty() {
        CommaDelimitedExtensibleEnumArrayProperty response = client
            .extensibleEnumCommaDelimited(new CommaDelimitedExtensibleEnumArrayProperty(EXTENSIBLE_ENUM_COLORS));
        Assertions.assertEquals(EXTENSIBLE_ENUM_COLORS, response.getValue());
    }

    @Test
    public void extensibleEnumSpaceDelimitedProperty() {
        SpaceDelimitedExtensibleEnumArrayProperty response = client
            .extensibleEnumSpaceDelimited(new SpaceDelimitedExtensibleEnumArrayProperty(EXTENSIBLE_ENUM_COLORS));
        Assertions.assertEquals(EXTENSIBLE_ENUM_COLORS, response.getValue());
    }

    @Test
    public void extensibleEnumPipeDelimitedProperty() {
        PipeDelimitedExtensibleEnumArrayProperty response
            = client.extensibleEnumPipeDelimited(new PipeDelimitedExtensibleEnumArrayProperty(EXTENSIBLE_ENUM_COLORS));
        Assertions.assertEquals(EXTENSIBLE_ENUM_COLORS, response.getValue());
    }

    @Test
    public void extensibleEnumNewlineDelimitedProperty() {
        NewlineDelimitedExtensibleEnumArrayProperty response = client
            .extensibleEnumNewlineDelimited(new NewlineDelimitedExtensibleEnumArrayProperty(EXTENSIBLE_ENUM_COLORS));
        Assertions.assertEquals(EXTENSIBLE_ENUM_COLORS, response.getValue());
    }
}
