// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;

public class CodeModelCustomConstructorTests {
    @Test
    public void immediateDiscriminatorValueDoesNotActAsStructuralKey() {
        String yaml = "type: object\n" + "discriminator:\n" + "  all:\n" + "    immediate:\n" + "      type: object\n"
            + "      discriminatorValue: immediate\n";

        ObjectSchema model
            = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, ObjectSchema.class);

        ObjectSchema subtype
            = Assertions.assertInstanceOf(ObjectSchema.class, model.getDiscriminator().getAll().get("immediate"));
        Assertions.assertEquals("immediate", subtype.getDiscriminatorValue());
    }

    @Test
    public void relationsPreserveSchemaTypes() {
        String yaml = "type: object\n" + "children:\n" + "  immediate:\n" + "    - type: object\n" + "  all:\n"
            + "    - type: object\n";

        ObjectSchema model
            = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, ObjectSchema.class);

        Relations relations = model.getChildren();
        Assertions.assertEquals(1, relations.getImmediate().size());
        Assertions.assertInstanceOf(ObjectSchema.class, relations.getImmediate().get(0));
        Assertions.assertEquals(1, relations.getAll().size());
        Assertions.assertInstanceOf(ObjectSchema.class, relations.getAll().get(0));
    }
}
