package tsptest.armstreamstyleserialization;

import com.azure.core.http.HttpClient;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.management.serializer.SerializerFactory;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.BinaryData;
import com.azure.core.util.serializer.SerializerAdapter;
import com.azure.core.util.serializer.SerializerEncoding;
import com.azure.json.JsonProviders;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;
import reactor.core.publisher.Mono;
import tsptest.armstreamstyleserialization.fluent.models.FunctionConfiguration;
import tsptest.armstreamstyleserialization.models.Error;
import tsptest.armstreamstyleserialization.models.Priority;
import tsptest.armstreamstyleserialization.models.SawShark;
import tsptest.armstreamstyleserialization.models.Shark;

public class StreamStyleSerializationTests {
    @Test
    public void testDuplicatePropertiesSerialization() throws IOException {
        // SawShark has "age" property in both itself, and its parent "Fish".
        int age = 10;
        SawShark model = new SawShark().withAge(age).withDna("upi");
        StringWriter stringWriter = new StringWriter();
        JsonWriter jsonWriter = JsonProviders.createWriter(stringWriter);
        model.toJson(jsonWriter);
        jsonWriter.flush();
        model = BinaryData.fromString(stringWriter.toString()).toObject(SawShark.class);
        Assertions.assertEquals(age, model.age());
    }

    @Test
    public void testManagementErrorDeserialization() throws IOException {
        final String errorBodyWithError
            = "{\"error\":{\"code\":\"WepAppError\",\"message\":\"Web app error.\",\"additionalProperty\":\"Deployment error.\",\"details\":[{\"code\":\"InnerError\", \"additionalProperty\": \"nested\"}]}}";
        final String errorBodyWithoutError
            = "{\"code\":\"WepAppError\",\"message\":\"Web app error.\",\"additionalProperty\":\"Deployment error.\",\"details\":[{\"code\":\"InnerError\", \"additionalProperty\": \"nested\"}]}";
        SerializerAdapter serializerAdapter = SerializerFactory.createDefaultManagementSerializerAdapter();
        Error error = serializerAdapter.deserialize(errorBodyWithError, Error.class, SerializerEncoding.JSON);
        Assertions.assertEquals("WepAppError", error.getCode());
        Assertions.assertEquals("Deployment error.", error.getAdditionalProperty());
        Assertions.assertEquals("nested", error.getDetails().iterator().next().getAdditionalProperty());

        error = serializerAdapter.deserialize(errorBodyWithoutError, Error.class, SerializerEncoding.JSON);
        Assertions.assertEquals("WepAppError", error.getCode());
        Assertions.assertEquals("Deployment error.", error.getAdditionalProperty());
        Assertions.assertEquals("nested", error.getDetails().iterator().next().getAdditionalProperty());
    }

    @Test
    public void testValidate() {
        Shark shark = new Shark();
        Assertions.assertThrows(IllegalArgumentException.class, shark::validate);

        shark.withAge(1);
        shark.withRequiredString("any");
        Assertions.assertThrows(IllegalArgumentException.class, shark::validate);

        shark.withRequiredStringAnotherPropertiesRequiredString("any");
        shark.validate();
    }

    @Test
    public void testExpandableEnum() {
        HttpClient httpClient = createExpandableEnumHttpClient();
        // normal case
        ArmResourceProviderManager manager = ArmResourceProviderManager
            .authenticate(new HttpPipelineBuilder().httpClient(httpClient).build(), ArmUtils.getAzureProfile());
        Priority priority = manager.priorities().setPriority(Priority.HIGH);
        Assertions.assertEquals(Priority.HIGH, priority);

        // null case
        priority = manager.priorities().setPriority(Priority.HIGH);
        Assertions.assertNull(priority);

        // exception case, expected number, but received string
        // azure-json wraps IllegalArgumentException
        Assertions.assertThrows(RuntimeException.class, () -> manager.priorities().setPriority(Priority.HIGH));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testPropertyWithNullValue() {
        FunctionConfiguration functionConfiguration = new FunctionConfiguration();
        Map<String, Object> jsonDict = (Map<String, Object>) BinaryData.fromObject(functionConfiguration).toObject(Map.class);
        Assertions.assertTrue(jsonDict.containsKey("input"));
        Assertions.assertNull(jsonDict.get("input"));
        Assertions.assertFalse(jsonDict.containsKey("output"));

        functionConfiguration = new FunctionConfiguration().withInput("input");
        jsonDict = (Map<String, Object>) BinaryData.fromObject(functionConfiguration).toObject(Map.class);
        Assertions.assertTrue(jsonDict.containsKey("input"));
        Assertions.assertEquals("input", jsonDict.get("input"));
    }

    private static HttpClient createExpandableEnumHttpClient() {
        AtomicInteger callCount = new AtomicInteger();
        HttpClient httpClient = request -> {
            int count = callCount.incrementAndGet();
            String query = request.getUrl().getQuery();
            Assertions.assertEquals("priority=0", query);
            if (count == 1) {
                // normal case
                return Mono.just(new MockHttpResponse(request, 200, "0".getBytes(StandardCharsets.UTF_8)));
            } else if (count == 2) {
                // null case
                return Mono.just(new MockHttpResponse(request, 200, "null".getBytes(StandardCharsets.UTF_8)));
            } else {
                // exception case, expected number, but received string
                return Mono.just(new MockHttpResponse(request, 200, "\"abc\"".getBytes(StandardCharsets.UTF_8)));
            }
        };
        return httpClient;
    }
}
