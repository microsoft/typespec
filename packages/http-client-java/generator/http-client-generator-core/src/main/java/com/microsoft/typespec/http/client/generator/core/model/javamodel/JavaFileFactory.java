// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;

import java.io.File;
import java.nio.file.Paths;

public class JavaFileFactory {
    private final JavaSettings settings;

    public JavaFileFactory(JavaSettings settings) {
        this.settings = settings;
    }

    public final JavaFile createEmptySourceFile(String packageKeyword, String fileNameWithoutExtension) {
        String folderPath = Paths.get("src", "main", "java", packageKeyword.replace('.', File.separatorChar)).toString();
        String filePath = Paths.get(folderPath).resolve(String.format("%1$s.java", fileNameWithoutExtension)).toString().replace('\\', '/').replace("//", "/");
        return new JavaFile(filePath);
    }

    public final JavaFile createSourceFile(String packageKeyword, String fileNameWithoutExtension) {
        JavaFile javaFile = createEmptySourceFile(packageKeyword, fileNameWithoutExtension);

        addCommentAndPackage(javaFile, packageKeyword);

        return javaFile;
    }

    public final JavaFile createSampleFile(String packageKeyword, String fileNameWithoutExtension) {
        String folderPath = Paths.get("src", "samples", "java", packageKeyword.replace('.', File.separatorChar)).toString();
        String filePath = Paths.get(folderPath).resolve(String.format("%1$s.java", fileNameWithoutExtension)).toString().replace('\\', '/').replace("//", "/");
        JavaFile javaFile = new JavaFile(filePath);

        addCommentAndPackage(javaFile, packageKeyword);

        return javaFile;
    }

    public final JavaFile createTestFile(String packageKeyword, String fileNameWithoutExtension) {
        String folderPath = Paths.get("src", "test", "java", packageKeyword.replace('.', File.separatorChar)).toString();
        String filePath = Paths.get(folderPath).resolve(String.format("%1$s.java", fileNameWithoutExtension)).toString().replace('\\', '/').replace("//", "/");
        JavaFile javaFile = new JavaFile(filePath);

        addCommentAndPackage(javaFile, packageKeyword);

        return javaFile;
    }

    private void addCommentAndPackage(JavaFile javaFile, String packageName) {
        String headerComment = settings.getFileHeaderText();
        if (headerComment != null && !headerComment.isEmpty()) {
            javaFile.lineComment(comment -> comment.line(headerComment));
            javaFile.line();
        }

        javaFile.declarePackage(packageName);
        javaFile.line();
    }
}
