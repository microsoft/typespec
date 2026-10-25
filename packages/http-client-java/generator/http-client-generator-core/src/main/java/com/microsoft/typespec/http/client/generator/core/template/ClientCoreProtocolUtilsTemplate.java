// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import java.util.List;
import java.util.Set;

/** Emits only the protocol utility methods referenced by a generated library. */
public final class ClientCoreProtocolUtilsTemplate implements IJavaTemplate<Set<String>, JavaFile> {
    private static final OptionalUtilityTemplate TEMPLATE = new OptionalUtilityTemplate(
        ClientModelUtil.CLIENT_CORE_PROTOCOL_UTILS, ClientModelUtil.CLIENT_CORE_PROTOCOL_UTILS);

    public static Set<String> getRequiredMethods(List<JavaFile> files) {
        return TEMPLATE.getRequiredMembers(files);
    }

    @Override
    public void write(Set<String> required, JavaFile file) {
        TEMPLATE.write(required, file);
    }
}
