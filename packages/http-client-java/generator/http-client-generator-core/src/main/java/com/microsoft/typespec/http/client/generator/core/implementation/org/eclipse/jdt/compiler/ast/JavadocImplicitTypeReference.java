// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2014 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Stephan Herrmann - Contribution for
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class JavadocImplicitTypeReference extends TypeReference {

    public char[] token;

    public JavadocImplicitTypeReference(char[] name, int pos) {
        super();
        this.token = name;
        this.sourceStart = pos;
        this.sourceEnd = pos;
    }

    @Override
    public TypeReference augmentTypeWithAdditionalDimensions(int additionalDimensions,
        Annotation[][] additionalAnnotations, boolean isVarargs) {
        return null;
    }

    @Override
    public char[][] getTypeName() {
        if (this.token != null) {
            return new char[][] { this.token };
        }
        return null;
    }

}
