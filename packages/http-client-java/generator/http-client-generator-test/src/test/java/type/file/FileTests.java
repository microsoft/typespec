// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.file;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.util.BinaryData;
import java.nio.file.Path;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.FileUtils;
import type.file.models.DownloadFileMultipleContentTypesContentType;

public class FileTests {

    private static final Path PNG_FILE = FileUtils.getPngFile();

    private final FileClient client = new FileClientBuilder().buildClient();

    @Test
    public void testUploadFileSpecificContentType() {
        client.uploadFileSpecificContentType(BinaryData.fromFile(PNG_FILE));
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
        client.uploadFileMultipleContentTypesWithResponse("image/png", BinaryData.fromFile(PNG_FILE), null);
    }

    @Test
    public void testDownloadFileMultipleContentTypes() {
        BinaryData response
            = client.downloadFileMultipleContentTypes(DownloadFileMultipleContentTypesContentType.IMAGE_PNG);
        Assertions.assertNotNull(response);
    }

    @Test
    public void testUploadFileDefaultContentType() {
        client.uploadFileDefaultContentTypeWithResponse(BinaryData.fromFile(PNG_FILE),
            new RequestOptions().setHeader(HttpHeaderName.CONTENT_TYPE, "image/png"));
    }

    @Test
    public void testDownloadFileDefaultContentType() {
        BinaryData response = client.downloadFileDefaultContentType();
        Assertions.assertNotNull(response);
    }
}
