// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.union;

import io.clientcore.core.models.binarydata.BinaryData;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class UnionsClientTest {

    private final StringsOnlyClient client1 = new UnionClientBuilder().buildStringsOnlyClient();
    private final StringExtensibleClient client2 = new UnionClientBuilder().buildStringExtensibleClient();
    private final StringExtensibleNamedClient client3 = new UnionClientBuilder().buildStringExtensibleNamedClient();
    private final IntsOnlyClient client4 = new UnionClientBuilder().buildIntsOnlyClient();
    private final FloatsOnlyClient client5 = new UnionClientBuilder().buildFloatsOnlyClient();
    private final ModelsOnlyClient client6 = new UnionClientBuilder().buildModelsOnlyClient();
    private final EnumsOnlyClient client7 = new UnionClientBuilder().buildEnumsOnlyClient();
    private final StringAndArrayClient client8 = new UnionClientBuilder().buildStringAndArrayClient();
    private final MixedLiteralsClient client9 = new UnionClientBuilder().buildMixedLiteralsClient();
    private final MixedTypesClient client10 = new UnionClientBuilder().buildMixedTypesClient();

    @Test
    public void testStringsOnlyClient() {
        GetResponseProp prop = client1.get().getProp();
        Assertions.assertEquals(GetResponseProp.B, prop);
        client1.send(prop);
    }

    @Test
    public void testStringExtensibleClient() {
        GetResponseProp1 prop = client2.get().getProp();
        Assertions.assertEquals("custom", prop.toString());
        client2.send(prop);
    }

    @Test
    public void testStringExtensibleNamedClient() {
        StringExtensibleNamedUnion prop = client3.get().getProp();
        Assertions.assertEquals("custom", prop.toString());
        client3.send(prop);
    }

    @Test
    public void testIntsOnlyClient() {
        GetResponseProp2 prop = client4.get().getProp();
        Assertions.assertEquals(2L, prop.toInt());
        client4.send(prop);
    }

    @Test
    public void testFloatsOnlyClient() {
        GetResponseProp3 prop = client5.get().getProp();
        Assertions.assertEquals(2.2, prop.toDouble());
        client5.send(prop);
    }

    @Test
    public void testModelsOnlyClient() throws IOException {
        BinaryData prop = client6.get().getProp();
        Assertions.assertEquals("test", ((Cat) prop.toObject(Cat.class)).getName());
        client6.send(BinaryData.fromObject(new Cat("test")));
    }

    @Test
    public void testEnumsOnlyClient() {
        EnumsOnlyCases prop = client7.get().getProp();
        Assertions.assertEquals(EnumsOnlyCasesLr.RIGHT, prop.getLr());
        Assertions.assertEquals(EnumsOnlyCasesUd.UP, prop.getUd());
        client7.send(prop);
    }

    @Test
    public void testStringAndArrayClient() throws IOException {
        StringAndArrayCases prop = client8.get().getProp();
        Assertions.assertEquals("test", prop.getString().toObject(String.class));
        Assertions.assertEquals(Arrays.asList("test1", "test2"), prop.getArray().toObject(List.class));
        client8.send(prop);
    }

    @Test
    public void testMixedLiteralsClient() throws IOException {
        MixedLiteralsCases prop = client9.get().getProp();
        Assertions.assertEquals("a", prop.getStringLiteral().toObject(String.class));
        Assertions.assertEquals(2L, Long.valueOf(prop.getIntLiteral().toString()));
        Assertions.assertEquals(3.3, prop.getFloatLiteral().toObject(Double.class));
        Assertions.assertEquals(true, prop.getBooleanLiteral().toObject(Boolean.class));
        client9.send(prop);
    }

    @Test
    public void testMixedTypesClient() throws IOException {
        MixedTypesCases prop = client10.get().getProp();
        Assertions.assertEquals("test", ((Cat) prop.getModel().toObject(Cat.class)).getName());
        Assertions.assertEquals("a", prop.getLiteral().toObject(String.class));
        Assertions.assertEquals(2L, Long.valueOf(prop.getIntProperty().toString()));
        Assertions.assertEquals(true, prop.getBooleanProperty().toObject(Boolean.class));
        List<BinaryData> array = prop.getArray();
        Assertions.assertEquals("test", ((Cat) array.get(0).toObject(Cat.class)).getName());
        Assertions.assertEquals("a", array.get(1).toObject(String.class));
        Assertions.assertEquals(2L, Long.valueOf(array.get(2).toString()));
        Assertions.assertEquals(true, array.get(3).toObject(Boolean.class));

        client10.send(prop);
    }
}
