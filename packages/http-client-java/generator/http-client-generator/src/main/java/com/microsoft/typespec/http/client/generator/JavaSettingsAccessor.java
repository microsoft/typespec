// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.azure.autorest.extension.base.plugin.JavaSettings;
import com.azure.autorest.extension.base.plugin.NewPlugin;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class JavaSettingsAccessor {

    public static void setHost(NewPlugin host) {
        try {
            Method setHost = JavaSettings.class.getDeclaredMethod("setHost", NewPlugin.class);
            setHost.setAccessible(true);
            setHost.invoke(null, host);
        } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
            e.printStackTrace();
        }
    }
}
