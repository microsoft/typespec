// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

public class MethodNamer {

    public static String getPagingAsyncSinglePageMethodName(String baseName) {
        return baseName + "SinglePageAsync";
    }

    public static String getPagingSinglePageMethodName(String baseName) {
        return baseName + "SinglePage";
    }

    public static String getSimpleAsyncMethodName(String baseName) {
        return baseName + "Async";
    }

    public static String getSimpleAsyncRestResponseMethodName(String baseName) {
        return baseName + "WithResponseAsync";
    }

    public static String getSimpleRestResponseMethodName(String baseName) {
        return baseName + "WithResponse";
    }

    public static String getLroBeginAsyncMethodName(String baseName) {
        return getLroBeginAsyncMethodNameInternal(CodeNamer.toPascalCase(baseName));
    }

    private static String getLroBeginAsyncMethodNameInternal(String formattedName) {
        return "begin" + formattedName + "Async";
    }

    public static String getLroBeginMethodName(String baseName) {
        return getLroBeginMethodNameInternal(CodeNamer.toPascalCase(baseName));
    }

    private static String getLroBeginMethodNameInternal(String formattedName) {
        return "begin" + formattedName;
    }

    private final String baseName;
    private final String pascalName;

    public MethodNamer(String baseName) {
        this.baseName = baseName;
        this.pascalName = CodeNamer.toPascalCase(baseName);
    }

    public String getMethodName() {
        return baseName;
    }

    public String getPagingAsyncSinglePageMethodName() {
        return getPagingAsyncSinglePageMethodName(this.getMethodName());
    }

    public String getPagingSinglePageMethodName() {
        return getPagingSinglePageMethodName(this.getMethodName());
    }

    public String getSimpleAsyncMethodName() {
        return getSimpleAsyncMethodName(this.getMethodName());
    }

    public String getSimpleAsyncRestResponseMethodName() {
        return getSimpleAsyncRestResponseMethodName(this.getMethodName());
    }

    public String getSimpleRestResponseMethodName() {
        return getSimpleRestResponseMethodName(this.getMethodName());
    }

    public String getLroBeginAsyncMethodName() {
        return getLroBeginAsyncMethodNameInternal(pascalName);
    }

    public String getLroBeginMethodName() {
        return getLroBeginMethodNameInternal(pascalName);
    }

    public String getLroModelBeginMethodName() {
        return "begin" + pascalName + "WithModel";
    }

    public String getLroModelBeginAsyncMethodName() {
        return "begin" + pascalName + "WithModelAsync";
    }
}
