package client.clientnamespace;

import client.clientnamespace.first.models.FirstClientResult;
import client.clientnamespace.second.ClientNamespaceSecondClient;
import client.clientnamespace.second.ClientNamespaceSecondClientBuilder;
import client.clientnamespace.second.models.SecondClientResult;
import client.clientnamespace.second.sub.models.SecondClientEnumType;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class NamespaceTests {

    @Test
    public void test() {
        FirstClientResult firstClientResult = new ClientNamespaceFirstClientBuilder().buildClient().getFirst();

        SecondClientResult secondClientResult = new ClientNamespaceSecondClientBuilder().buildClient().getSecond();

        // assert Java package name is expected
        Assertions.assertEquals("client.clientnamespace.ClientNamespaceFirstClient",
            ClientNamespaceFirstClient.class.getName());
        Assertions.assertEquals("client.clientnamespace.second.ClientNamespaceSecondClient",
            ClientNamespaceSecondClient.class.getName());
        Assertions.assertEquals("client.clientnamespace.first.models.FirstClientResult",
            FirstClientResult.class.getName());
        Assertions.assertEquals("client.clientnamespace.second.models.SecondClientResult",
            SecondClientResult.class.getName());
        Assertions.assertEquals("client.clientnamespace.second.sub.models.SecondClientEnumType",
            SecondClientEnumType.class.getName());
    }
}
