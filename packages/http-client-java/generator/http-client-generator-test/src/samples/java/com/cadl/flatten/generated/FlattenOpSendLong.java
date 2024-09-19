// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.flatten.generated;

import com.azure.core.util.Configuration;
import com.cadl.flatten.FlattenClient;
import com.cadl.flatten.FlattenClientBuilder;
import com.cadl.flatten.models.SendLongOptions;
import com.cadl.flatten.models.SendLongRequestStatus;
import com.cadl.flatten.models.User;

public class FlattenOpSendLong {
    public static void main(String[] args) {
        FlattenClient flattenClient
            = new FlattenClientBuilder().endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT")).buildClient();
        // BEGIN:com.cadl.flatten.generated.sendlong.flattenopsendlong
        flattenClient.sendLong(
            new SendLongOptions("myRequiredId", "myRequiredInput", 11, null, "title", SendLongRequestStatus.NOT_STARTED)
                .setFilter("name=myName")
                .setUser(new User("myOptionalUser"))
                .setDataIntOptional(12)
                .setDataLong(13L)
                .setDataFloat(14.0D)
                .setDescription("description"));
        // END:com.cadl.flatten.generated.sendlong.flattenopsendlong
    }
}
