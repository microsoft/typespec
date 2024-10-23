// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.preprocessor.Preprocessor;

public class ConstantSchemaOptimization {

    public CodeModel process(CodeModel codeModel) {
        return Preprocessor.convertOptionalConstantsToEnum(codeModel);
    }
}
