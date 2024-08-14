// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.projectmodel;

public class TextFile {
    private final String filePath;
    private String contents;

    public TextFile(String filePath) {
        this(filePath, null);
    }

    public TextFile(String filePath, String contents) {
        this.filePath = filePath;
        this.contents = contents;
    }

    public final String getFilePath() {
        return filePath;
    }

    public final String getContents() {
        return contents;
    }

    public void setContents(String contents) {
        this.contents = contents;
    }
}
