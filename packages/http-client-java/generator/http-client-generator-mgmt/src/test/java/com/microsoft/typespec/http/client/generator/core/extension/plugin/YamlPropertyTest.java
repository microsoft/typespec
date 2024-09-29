// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.plugin;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnnotatedPropertyUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.inspector.TrustedTagInspector;
import org.yaml.snakeyaml.representer.Representer;

public class YamlPropertyTest {

    @Test
    public void test() {

        Representer representer = new Representer(new DumperOptions());

        representer.setPropertyUtils(new AnnotatedPropertyUtils());
        representer.getPropertyUtils().setSkipMissingProperties(true);

        LoaderOptions loaderOptions = new LoaderOptions();
        loaderOptions.setCodePointLimit(50 * 1024 * 1024);
        loaderOptions.setMaxAliasesForCollections(Integer.MAX_VALUE);
        loaderOptions.setNestingDepthLimit(Integer.MAX_VALUE);
        loaderOptions.setTagInspector(new TrustedTagInspector());
        Constructor constructor = new CodeModelCustomConstructor(loaderOptions);
        Yaml yamlMapper = new Yaml(constructor, representer, new DumperOptions(), loaderOptions);

        TestYamlPropertyBean bean = yamlMapper
            .loadAs(getClass().getClassLoader().getResourceAsStream("yaml-property.yaml"), TestYamlPropertyBean.class);

        Assertions.assertTrue(bean.getPropertyToRemap());
        Assertions.assertNotNull(bean.getExtensions());
        Assertions.assertTrue(bean.getExtensions().getXmsExamples());
    }

}
