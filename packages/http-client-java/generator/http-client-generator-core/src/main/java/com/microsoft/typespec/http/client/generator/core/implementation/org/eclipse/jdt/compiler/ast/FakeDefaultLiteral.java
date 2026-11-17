// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2021 IBM Corporation and others.
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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

/**
 * Sole purpose of {@link FakeDefaultLiteral} is to appear in case 'default' of switch patterns (JEP 406 at the time of
 * writing this comment)
 */
public class FakeDefaultLiteral extends MagicLiteral {

    public FakeDefaultLiteral(int s, int e) {
        super(s, e);
    }

}
