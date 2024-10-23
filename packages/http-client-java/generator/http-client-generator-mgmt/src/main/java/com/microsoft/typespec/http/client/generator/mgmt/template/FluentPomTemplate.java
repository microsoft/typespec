// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlBlock;
import com.microsoft.typespec.http.client.generator.core.template.PomTemplate;

public class FluentPomTemplate extends PomTemplate {

    private static final FluentPomTemplate INSTANCE = new FluentPomTemplate();

    protected FluentPomTemplate() {
    }

    public static FluentPomTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void writeJacoco(XmlBlock propertiesBlock) {
        super.writeJacoco(propertiesBlock);

        propertiesBlock.tag("jacoco.min.linecoverage", "0");
        propertiesBlock.tag("jacoco.min.branchcoverage", "0");
    }

    @Override
    protected void writeRevapi(XmlBlock propertiesBlock, Pom pom) {
        super.writeRevapi(propertiesBlock, pom);

        // skip revapi if preview
        if (pom.getVersion().contains("-beta.")) {
            propertiesBlock.tag("revapi.skip", "true");
        }
    }
}
