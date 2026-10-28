// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.experimental;

import static net.bytebuddy.matcher.ElementMatchers.named;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import net.bytebuddy.description.annotation.AnnotationList;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.pool.TypePool;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.experimental.annotations.Preview;
import tsptest.experimental.models.Choice;
import tsptest.experimental.models.Excluded;
import tsptest.experimental.models.OpenChoice;
import tsptest.experimental.models.OtherEmitter;
import tsptest.experimental.models.PreviewModel;
import tsptest.experimental.models.Scoped;
import tsptest.experimental.models.Stable;

public class ExperimentalTests {
    private static final String DEFAULT_WARNING = "Preview API - subject to change in non-backwards compatible way";
    // Read class files because experimental annotations use CLASS retention.
    private static final TypePool TYPES = TypePool.Default.of(ExperimentalTests.class.getClassLoader());

    @Test
    public void generatesRequiredWarningTextAndSharedConstant() throws NoSuchMethodException {
        Assertions.assertTrue(Preview.class.isAnnotation());
        Assertions.assertTrue(Preview.class.isAnnotationPresent(Documented.class));
        Assertions.assertEquals(RetentionPolicy.CLASS, Preview.class.getAnnotation(Retention.class).value());
        Assertions.assertEquals(1, Preview.class.getDeclaredMethods().length);
        Assertions.assertEquals(String.class, Preview.class.getDeclaredMethod("warningText").getReturnType());
        Assertions.assertNull(Preview.class.getDeclaredMethod("warningText").getDefaultValue());
        Assertions.assertEquals(DEFAULT_WARNING, Preview.WARNING_TEXT);
    }

    @Test
    public void annotatesClientsAndOperations() {
        for (Class<?> client : new Class<?>[] {
            ExperimentalClient.class,
            ExperimentalAsyncClient.class,
            GroupClient.class,
            GroupAsyncClient.class }) {
            TypeDescription type = describe(client);
            assertExperimental(type.getDeclaredAnnotations());
            Assertions.assertFalse(type.getDeclaredMethods().filter(named("read")).isEmpty());
            Assertions.assertFalse(type.getDeclaredMethods().filter(named("readWithResponse")).isEmpty());
            type.getDeclaredMethods()
                .filter(named("read").or(named("readWithResponse")))
                .forEach(method -> assertExperimental(method.getDeclaredAnnotations()));
        }

        for (Class<?> client : new Class<?>[] { ExperimentalClient.class, ExperimentalAsyncClient.class }) {
            TypeDescription type = describe(client);
            for (String name : new String[] { "stable", "stableWithResponse" }) {
                Assertions.assertFalse(type.getDeclaredMethods().filter(named(name)).isEmpty());
                type.getDeclaredMethods()
                    .filter(named(name))
                    .forEach(method -> Assertions
                        .assertFalse(method.getDeclaredAnnotations().isAnnotationPresent(Preview.class)));
            }
        }
    }

    @Test
    public void annotatesOperationParameters() {
        for (Class<?> client : new Class<?>[] { ExperimentalClient.class, ExperimentalAsyncClient.class }) {
            TypeDescription type = describe(client);
            boolean hasQueryParameter = false;
            for (var method : type.getDeclaredMethods().filter(named("read").or(named("readWithResponse")))) {
                assertExperimental(method.getParameters().get(0).getDeclaredAnnotations());
                for (var parameter : method.getParameters()) {
                    if (parameter.getType().asErasure().represents(String.class)) {
                        assertExperimental(parameter.getDeclaredAnnotations());
                        hasQueryParameter = true;
                    }
                }
            }
            Assertions.assertTrue(hasQueryParameter, client.getName());
        }
    }

    @Test
    public void annotatesModelsAndPropertyAccessors() {
        TypeDescription model = describe(PreviewModel.class);
        assertExperimental(model.getDeclaredAnnotations());
        assertExperimental(model.getDeclaredMethods().filter(named("getValue")).getOnly().getDeclaredAnnotations());
        assertExperimental(model.getDeclaredMethods().filter(named("setValue")).getOnly().getDeclaredAnnotations());
        Assertions.assertFalse(model.getDeclaredMethods()
            .filter(named("getStableValue"))
            .getOnly()
            .getDeclaredAnnotations()
            .isAnnotationPresent(Preview.class));
        Assertions.assertFalse(model.getDeclaredMethods()
            .filter(named("setStableValue"))
            .getOnly()
            .getDeclaredAnnotations()
            .isAnnotationPresent(Preview.class));
    }

    @Test
    public void annotatesEnumsAndValues() {
        for (Class<?> enumType : new Class<?>[] { Choice.class, OpenChoice.class }) {
            TypeDescription type = describe(enumType);
            assertExperimental(type.getDeclaredAnnotations());
            assertExperimental(type.getDeclaredFields().filter(named("ONE")).getOnly().getDeclaredAnnotations());
            Assertions.assertFalse(type.getDeclaredFields()
                .filter(named("TWO"))
                .getOnly()
                .getDeclaredAnnotations()
                .isAnnotationPresent(Preview.class));
        }
    }

    @Test
    public void honorsEmitterScopes() {
        assertExperimental(describe(Scoped.class).getDeclaredAnnotations());
        for (Class<?> model : new Class<?>[] { Stable.class, OtherEmitter.class, Excluded.class }) {
            Assertions.assertFalse(describe(model).getDeclaredAnnotations().isAnnotationPresent(Preview.class),
                model.getName());
        }
    }

    @Test
    public void allowsJavaCustomizationsToSupplyWarningText() {
        Assertions.assertEquals("Customized preview",
            describe(CustomizedModel.class).getDeclaredAnnotations()
                .ofType(Preview.class)
                .getValue("warningText")
                .resolve(String.class));
    }

    private static TypeDescription describe(Class<?> type) {
        return TYPES.describe(type.getName()).resolve();
    }

    private static void assertExperimental(AnnotationList annotations) {
        Assertions.assertTrue(annotations.isAnnotationPresent(Preview.class), annotations::toString);
        Assertions.assertEquals(Preview.WARNING_TEXT,
            annotations.ofType(Preview.class).getValue("warningText").resolve(String.class));
    }

    @Preview(warningText = "Customized preview")
    private static final class CustomizedModel {
    }
}
