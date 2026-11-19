// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *     Stephan Herrmann - Contributions for
 *     							bug 343713 - [compiler] bogus line number in constructor of inner class in 1.5 compliance
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 361407 - Resource leak warning when resource is assigned to a field outside of constructor
 *								bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *								bug 383690 - [compiler] location of error re uninitialized final field should be aligned
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								bug 400421 - [compiler] Null analysis for fields does not take @com.google.inject.Inject into account
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 416176 - [1.8][compiler][null] null type annotations cause grief on type variables
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 415399 - [1.8][compiler] Type annotations on constructor results dropped by the code generator
 *     Ulrich Grave <ulrich.grave@gmx.de> - Contributions for
 *                              bug 386692 - Missing "unused" warning on "autowired" fields
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Parser;

public class ConstructorDeclaration extends AbstractMethodDeclaration {

    public ExplicitConstructorCall constructorCall;

    public TypeParameter[] typeParameters;

    public ConstructorDeclaration(CompilationResult compilationResult) {
        super(compilationResult);
    }

    @Override
    public boolean isConstructor() {
        return true;
    }

    @Override
    public boolean isDefaultConstructor() {
        return (this.bits & 128) != 0;
    }

    @Override
    public void parseStatements(Parser parser, CompilationUnitDeclaration unit) {
        // fill up the constructor body with its statements
        if (((this.bits & 128) != 0) && this.constructorCall == null) {
            this.constructorCall = SuperReference.implicitSuperConstructorCall();
            this.constructorCall.sourceStart = this.sourceStart;
            this.constructorCall.sourceEnd = this.sourceEnd;
            return;
        }
        parser.parse(this, unit, false);
    }

    @Override
    public TypeParameter[] typeParameters() {
        return this.typeParameters;
    }
}
