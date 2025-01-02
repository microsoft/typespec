// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.contentnegotiation;

import io.clientcore.core.http.models.HttpLogOptions;
import io.clientcore.core.util.binarydata.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.FileUtils;
import payload.contentnegotiation.differentbody.PngImageAsJson;

public class SharedRouteTests {

    private final SameBodyClient client1 = new ContentNegotiationClientBuilder().buildSameBodyClient();
    private final DifferentBodyClient client2 = new ContentNegotiationClientBuilder()
        .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogOptions.HttpLogDetailLevel.BODY_AND_HEADERS))
        .buildDifferentBodyClient();

    @Test
    public void testContentNegotiation() {
        byte[] jpgBytes = FileUtils.getJpgBytes();
        byte[] pngBytes = FileUtils.getPngBytes();

        BinaryData jpeg = client1.getAvatarAsJpeg();
        Assertions.assertNotNull(jpeg);
        Assertions.assertArrayEquals(jpgBytes, jpeg.toBytes());

        BinaryData png = client1.getAvatarAsPng();
        Assertions.assertNotNull(png);
        Assertions.assertArrayEquals(pngBytes, png.toBytes());

        PngImageAsJson pngJson = client2.getAvatarAsJson();
        Assertions.assertNotNull(pngJson.getContent());
        Assertions.assertArrayEquals(pngBytes, pngJson.getContent());

        png = client2.getAvatarAsPng();
        Assertions.assertNotNull(png);
        Assertions.assertArrayEquals(pngBytes, png.toBytes());
    }
}
