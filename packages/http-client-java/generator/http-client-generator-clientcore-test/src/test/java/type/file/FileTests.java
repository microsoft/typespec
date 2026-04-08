// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.file;

import io.clientcore.core.models.binarydata.BinaryData;
import java.nio.file.Path;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.utils.FileUtils;

public class FileTests {

    private static final Path PNG_FILE = FileUtils.getPngFile();

    private final FileClient client = new FileClientBuilder().buildFileClient();

    @Test
    public void testUploadFileSpecificContentType() {
        BinaryData fileData = BinaryData.fromFile(PNG_FILE);
        client.uploadFileSpecificContentType(fileData, fileData.getLength());
    }

    @Disabled("possible bug in clientcore")
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

    @Disabled("possible bug in clientcore")
    @Test
    public void testUploadFileMultipleContentTypes() {
        BinaryData fileData = BinaryData.fromFile(PNG_FILE);
        client.uploadFileMultipleContentTypes(UploadFileMultipleContentTypesContentType.IMAGE_PNG, fileData,
            fileData.getLength());
    }

    @Test
    public void testDownloadFileMultipleContentTypes() {
        BinaryData response
            = client.downloadFileMultipleContentTypes(DownloadFileMultipleContentTypesContentType.IMAGE_PNG);
        Assertions.assertNotNull(response);
    }

    @Test
    public void testUploadFileDefaultContentType() {
        BinaryData fileData = BinaryData.fromFile(PNG_FILE);
        client.uploadFileDefaultContentType("image/png", fileData, fileData.getLength());
    }

    @Test
    public void testDownloadFileDefaultContentType() {
        BinaryData response = client.downloadFileDefaultContentType("image/png");
        Assertions.assertNotNull(response);
    }
}
