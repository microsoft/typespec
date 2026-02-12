// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.file;

import com.azure.core.util.BinaryData;
import java.nio.file.Path;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.FileUtils;

public class FileTests {

    private static final Path PNG_FILE = FileUtils.getPngFile();

    private final FileClient client = new FileClientBuilder().buildClient();

    @Test
    public void testUploadFileSpecificContentType() {
        client.uploadFileSpecificContentType("image/png", BinaryData.fromFile(PNG_FILE));
    }

    @Test
    public void testUploadFileJsonContentType() {
        // For JSON content type, we need to send a JSON payload
        BinaryData jsonData = BinaryData.fromString("{\"message\":\"test file content\"}");
        client.uploadFileJsonContentType(jsonData);
    }

    @Test
    public void testDownloadFileJsonContentType() {
        BinaryData response = client.downloadFileJsonContentType();
        Assertions.assertNotNull(response);
    }

    @Test
    public void testDownloadFileSpecificContentType() {
        BinaryData response = client.downloadFileSpecificContentType();
        Assertions.assertNotNull(response);
    }

    @Test
    public void testUploadFileMultipleContentTypes() {
        client.uploadFileMultipleContentTypes("image/png", BinaryData.fromFile(PNG_FILE));
    }

    @Test
    public void testDownloadFileMultipleContentTypes() {
        BinaryData response = client.downloadFileMultipleContentTypes("image/png");
        Assertions.assertNotNull(response);
    }

    @Test
    public void testUploadFileDefaultContentType() {
        client.uploadFileDefaultContentType("image/png", BinaryData.fromFile(PNG_FILE));
    }

    @Test
    public void testDownloadFileDefaultContentType() {
        BinaryData response = client.downloadFileDefaultContentType();
        Assertions.assertNotNull(response);
    }
}
