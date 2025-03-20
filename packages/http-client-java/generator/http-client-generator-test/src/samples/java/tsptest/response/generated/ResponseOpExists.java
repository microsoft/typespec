// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.response.generated;

import com.azure.core.util.Configuration;
import tsptest.response.ResponseClient;
import tsptest.response.ResponseClientBuilder;

public class ResponseOpExists {
    public static void main(String[] args) {
        ResponseClient responseClient
            = new ResponseClientBuilder().endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT"))
                .buildClient();
        // BEGIN:tsptest.response.generated.exists.responseopexists
        boolean response = responseClient.exists();
        // END:tsptest.response.generated.exists.responseopexists
    }
}
