// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.file;

import io.clientcore.core.models.binarydata.BinaryData;
import java.nio.file.Path;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.FileUtils;

public class FileTests {

    private static final Path PNG_FILE = FileUtils.getPngFile();

    private final FileClient client = new FileClientBuilder().buildFileClient();

    @Test
    public void testUploadFileSpecificContentType() {
        BinaryData fileData = BinaryData.fromFile(PNG_FILE);
        client.uploadFileSpecificContentType("image/png", fileData, fileData.getLength());
    }

    @Test
    public void testUploadFileJsonContentType() {
        // For JSON content type, we need to send a JSON payload
        BinaryData jsonData = BinaryData.fromString("{\"message\":\"test file content\"}");
        client.uploadFileJsonContentType(jsonData, jsonData.getLength());
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
        BinaryData fileData = BinaryData.fromFile(PNG_FILE);
        client.uploadFileMultipleContentTypes("image/png", fileData, fileData.getLength());
    }

    @Test
    public void testDownloadFileMultipleContentTypes() {
        BinaryData response = client.downloadFileMultipleContentTypes("image/png");
        Assertions.assertNotNull(response);
    }

    @Test
    public void testUploadFileDefaultContentType() {
        BinaryData fileData = BinaryData.fromFile(PNG_FILE);
        client.uploadFileDefaultContentType("image/png", fileData, fileData.getLength());
    }

    @Test
    public void testDownloadFileDefaultContentType() {
        BinaryData response = client.downloadFileDefaultContentType();
        Assertions.assertNotNull(response);
    }
}
