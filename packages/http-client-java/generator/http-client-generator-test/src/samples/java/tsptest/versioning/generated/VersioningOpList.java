// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.versioning.generated;

import com.azure.core.http.rest.PagedIterable;
import com.azure.core.util.Configuration;
import java.util.Arrays;
import tsptest.versioning.VersioningClient;
import tsptest.versioning.VersioningClientBuilder;
import tsptest.versioning.models.Resource;

public class VersioningOpList {
    public static void main(String[] args) {
        VersioningClient versioningClient
            = new VersioningClientBuilder().endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT"))
                .buildClient();
        // BEGIN:tsptest.versioning.generated.versioningoplist.versioningoplist
        PagedIterable<Resource> response = versioningClient.list(Arrays.asList("name=name"), null);
        // END:tsptest.versioning.generated.versioningoplist.versioningoplist
    }
}
