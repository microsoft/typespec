// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2016 IBM Corporation and others.
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
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 415397 - [1.8][compiler] Type Annotations on wildcard type argument dropped
 *        Stephan Herrmann - Contribution for
 *							Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *							Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *							Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *							Bug 440462 - [null][compiler]NPE in EJC for erroneous null annotations
 *							Bug 441693 - [1.8][null] Bogus warning for type argument annotated with @NonNull
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;

/**
 * Node to represent Wildcard
 */
public class Wildcard extends SingleTypeReference {

    public TypeReference bound;
    public int kind;

    public Wildcard(int kind) {
        super(WILDCARD_NAME, 0);
        this.kind = kind;
    }

    @Override
    public char[][] getTypeName() {
        return switch (this.kind) {
            case 0 -> new char[][] { WILDCARD_NAME };
            case 1 -> new char[][] {
                CharOperation.concat(WILDCARD_NAME, WILDCARD_EXTENDS,
                    CharOperation.concatWith(this.bound.getTypeName())) };
            default -> // SUPER
                new char[][] {
                    CharOperation.concat(WILDCARD_NAME, WILDCARD_SUPER,
                        CharOperation.concatWith(this.bound.getTypeName())) };
        };
    }

}
