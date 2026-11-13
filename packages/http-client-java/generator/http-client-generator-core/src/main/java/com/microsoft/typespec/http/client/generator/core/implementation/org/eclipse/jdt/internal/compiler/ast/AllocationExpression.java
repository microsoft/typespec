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
 *     						bug 236385 - [compiler] Warn for potential programming problem if an object is created but not used
 *     						bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *     						bug 349326 - [1.7] new warning for missing try-with-resources
 * 							bug 186342 - [compiler][null] Using annotations for null checking
 *							bug 358903 - Filter practically unimportant resource leak warnings
 *							bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *							bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *							bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *							bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *							bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *							Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *							Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *							Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *							Bug 424727 - [compiler][null] NullPointerException in nullAnnotationUnsupportedLocation(ProblemHandler.java:5708)
 *							Bug 424710 - [1.8][compiler] CCE in SingleNameReference.localVariableBinding
 *							Bug 425152 - [1.8] [compiler] Lambda Expression not resolved but flow analyzed leading to NPE.
 *							Bug 424205 - [1.8] Cannot infer type for diamond type with lambda on method invocation
 *							Bug 424415 - [1.8][compiler] Eventual resolution of ReferenceExpression is not seen to be happening.
 *							Bug 426366 - [1.8][compiler] Type inference doesn't handle multiple candidate target types in outer overload context
 *							Bug 426290 - [1.8][compiler] Inference + overloading => wrong method resolution ?
 *							Bug 426764 - [1.8] Presence of conditional expression as method argument confuses compiler
 *							Bug 424930 - [1.8][compiler] Regression: "Cannot infer type arguments" error from compiler.
 *							Bug 427483 - [Java 8] Variables in lambdas sometimes can't be resolved
 *							Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *							Bug 426996 - [1.8][inference] try to avoid method Expression.unresolve()?
 *							Bug 428352 - [1.8][compiler] Resolution errors don't always surface
 *							Bug 429203 - [1.8][compiler] NPE in AllocationExpression.binding
 *							Bug 429430 - [1.8] Lambdas and method reference infer wrong exception type with generics (RuntimeException instead of IOException)
 *							Bug 434297 - [1.8] NPE in LamdaExpression.analyseCode with lamda expression nested in a conditional expression
 *							Bug 452788 - [1.8][compiler] Type not correctly inferred in lambda expression
 *							Bug 448709 - [1.8][null] ensure we don't infer types that violate null constraints on a type parameter's bound
 *     Jesper S Moller <jesper@selskabet.org> - Contributions for
 *							bug 378674 - "The method can be declared as static" is wrong
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409245 - [1.8][compiler] Type annotations dropped when call is routed through a synthetic bridge method
 *     Till Brychcy - Contributions for
 *     						bug 413460 - NonNullByDefault is not inherited to Constructors when accessed via Class File
 *     Lars Vogel <Lars.Vogel@vogella.com> - Contributions for
 *     						Bug 473178
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

public class AllocationExpression extends Expression {

    public TypeReference type;
    public Expression[] arguments;
    public TypeReference[] typeArguments;

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.type != null) { // type null for enum constant initializations
            output.append("new "); //$NON-NLS-1$
        }
        if (this.typeArguments != null) {
            output.append('<');
            int max = this.typeArguments.length - 1;
            for (int j = 0; j < max; j++) {
                this.typeArguments[j].print(0, output);
                output.append(", ");//$NON-NLS-1$
            }
            this.typeArguments[max].print(0, output);
            output.append('>');
        }
        if (this.type != null) { // type null for enum constant initializations
            this.type.printExpression(0, output);
        }
        output.append('(');
        if (this.arguments != null) {
            for (int i = 0; i < this.arguments.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.arguments[i].printExpression(0, output);
            }
        }
        return output.append(')');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit()) {
            if (this.typeArguments != null) {
                for (TypeReference typeArgument : this.typeArguments) {
                    typeArgument.traverse(visitor, scope);
                }
            }
            if (this.type != null) { // enum constant scenario
                this.type.traverse(visitor, scope);
            }
            if (this.arguments != null) {
                for (Expression argument : this.arguments)
                    argument.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
