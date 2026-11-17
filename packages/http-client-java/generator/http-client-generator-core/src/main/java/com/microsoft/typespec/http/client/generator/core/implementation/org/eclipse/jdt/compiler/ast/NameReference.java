// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 426996 - [1.8][inference] try to avoid method Expression.unresolve()?
 *     Jesper S Moller - Contributions for
 *							bug 382721 - [1.8][compiler] Effectively final variables needs special treatment
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public abstract class NameReference extends Reference {

    // the error printing
    // some name reference are build as name reference but
    // only used as type reference. When it happens, instead of
    // creating a new object (aTypeReference) we just flag a boolean
    // This concesion is valuable while there are cases when the NameReference
    // will be a TypeReference (static message sends.....) and there is
    // no changeClass in java.
    public NameReference() {
        this.bits |= 4 | 3; // restrictiveFlag
    }

    public abstract char[][] getName();

}
