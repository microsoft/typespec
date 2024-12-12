// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.naming;

import client.naming.model.models.ClientModel;
import client.naming.model.models.JavaModel;
import client.naming.property.models.ClientNameAndJsonEncodedNameModel;
import client.naming.property.models.ClientNameModel;
import client.naming.property.models.LanguageClientNameModel;
import client.naming.unionenum.models.ClientExtensibleEnum;
import client.naming.unionenum.models.ExtensibleEnum;
import org.junit.jupiter.api.Test;

public class NamingTests {

    private final NamingClient client = new NamingClientBuilder().buildClient();

    // client name should be "ClientModel", currently a bug in TCGC
    private final ClientModelClient modelClient = new NamingClientBuilder().buildClientModelClient();

    private final UnionEnumClient enumClient = new NamingClientBuilder().buildUnionEnumClient();

    @Test
    public void testNaming() {
        // operation
        client.clientName();

        // parameter
        client.parameter("true");

        // property
        client.client(new ClientNameModel(true));
        client.language(new LanguageClientNameModel(true));
        client.compatibleWithEncodedName(new ClientNameAndJsonEncodedNameModel(true));

        // header
        client.request("true");
        client.response();  // no class about response header at present

        // model
        modelClient.client(new ClientModel(true));
        modelClient.language(new JavaModel(true));

        // enum
        enumClient.unionEnumName(ClientExtensibleEnum.ENUM_VALUE1);
        enumClient.unionEnumMemberName(ExtensibleEnum.CLIENT_ENUM_VALUE1);
    }
}
