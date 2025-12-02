// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import io.clientcore.core.utils.CoreUtils;

public class MetadataUtil {

    private MetadataUtil() {

    }

    /**
     * Get latest api-version from first client. This only works in TypeSpec Azure flavor.
     *
     * @param codeModel the code model.
     * @return the latest api-version from first client.
     */
    public static String getLatestApiVersionFromClient(CodeModel codeModel) {
        String apiVersion = null;
        if (!CoreUtils.isNullOrEmpty(codeModel.getClients())) {
            Client client = codeModel.getClients().iterator().next();
            if (!CoreUtils.isNullOrEmpty(client.getApiVersions())) {
                return client.getApiVersions().get(client.getApiVersions().size() - 1).getVersion();
            }
        }
        return apiVersion;
    }
}
