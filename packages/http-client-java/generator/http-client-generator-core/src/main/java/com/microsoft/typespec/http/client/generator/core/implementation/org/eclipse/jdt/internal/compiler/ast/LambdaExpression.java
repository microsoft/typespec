// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2012, 2025 IBM Corporation and others.
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
 *     Jesper S Moller - Contributions for
 *							bug 382701 - [1.8][compiler] Implement semantic analysis of Lambda expressions & Reference expression
 *							bug 382721 - [1.8][compiler] Effectively final variables needs special treatment
 *							Bug 416885 - [1.8][compiler]IncompatibleClassChange error (edit)
 *     Stephan Herrmann - Contribution for
 *							bug 401030 - [1.8][null] Null analysis support for lambda methods.
 *							Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *							Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *							Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *							Bug 423504 - [1.8] Implement "18.5.3 Functional Interface Parameterization Inference"
 *							Bug 425142 - [1.8][compiler] NPE in ConstraintTypeFormula.reduceSubType
 *							Bug 425153 - [1.8] Having wildcard allows incompatible types in a lambda expression
 *							Bug 424205 - [1.8] Cannot infer type for diamond type with lambda on method invocation
 *							Bug 425798 - [1.8][compiler] Another NPE in ConstraintTypeFormula.reduceSubType
 *							Bug 425156 - [1.8] Lambda as an argument is flagged with incompatible error
 *							Bug 424403 - [1.8][compiler] Generic method call with method reference argument fails to resolve properly.
 *							Bug 426563 - [1.8] AIOOBE when method with error invoked with lambda expression as argument
 *							Bug 420525 - [1.8] [compiler] Incorrect error "The type Integer does not define sum(Object, Object) that is applicable here"
 *							Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *							Bug 428294 - [1.8][compiler] Type mismatch: cannot convert from List<Object> to Collection<Object[]>
 *							Bug 428786 - [1.8][compiler] Inference needs to compute the "ground target type" when reducing a lambda compatibility constraint
 *							Bug 428980 - [1.8][null] simple expression as lambda body doesn't leverage null annotation on argument
 *							Bug 429430 - [1.8] Lambdas and method reference infer wrong exception type with generics (RuntimeException instead of IOException)
 *							Bug 432110 - [1.8][compiler] nested lambda type incorrectly inferred vs javac
 *							Bug 438458 - [1.8][null] clean up handling of null type annotations wrt type variables
 *							Bug 441693 - [1.8][null] Bogus warning for type argument annotated with @NonNull
 *							Bug 452788 - [1.8][compiler] Type not correctly inferred in lambda expression
 *							Bug 453483 - [compiler][null][loop] Improve null analysis for loops
 *							Bug 455723 - Nonnull argument not correctly inferred in loop
 *							Bug 463728 - [1.8][compiler][inference] Ternary operator in lambda derives wrong type
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 405104 - [1.8][compiler][codegen] Implement support for serializeable lambdas
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.Scope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortMethod;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortType;

public class LambdaExpression extends FunctionalExpression implements ReferenceContext {
    public Argument[] arguments;

    public Statement body;
    public boolean hasParentheses;

    private static final Block NO_BODY = new Block(0);

    public LambdaExpression(CompilationResult compilationResult) {
        super(compilationResult);

        setArguments(NO_ARGUMENTS);
        setBody(NO_BODY);
    }

    public void setArguments(Argument[] arguments) {
        this.arguments = arguments != null ? arguments : ASTNode.NO_ARGUMENTS;
        for (Argument argument : this.arguments) {
            if (argument.hasElidedType())
                this.bits |= 2;
            else if (argument.type instanceof SingleTypeReference str
                && CharOperation.equals(str.token, TypeConstants.VAR)) {
                this.bits |= 2;

            }
        }
    }

    public Argument[] arguments() {
        return this.arguments;
    }

    public void setBody(Statement body) {
        this.body = body == null ? NO_BODY : body;
    }

    public Statement body() {
        return this.body;
    }

    @Override
    public StringBuilder printExpression(int tab, StringBuilder output) {
        return printExpression(tab, output, false);
    }

    public StringBuilder printExpression(int tab, StringBuilder output, boolean makeShort) {
        int parenthesesCount = (this.bits & 534773760) >> 21;
        String suffix = ""; //$NON-NLS-1$
        for (int i = 0; i < parenthesesCount; i++) {
            output.append('(');
            suffix += ')';
        }
        output.append('(');
        if (this.arguments != null) {
            for (int i = 0; i < this.arguments.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.arguments[i].print(0, output);
            }
        }
        output.append(") -> "); //$NON-NLS-1$
        if (makeShort) {
            output.append("{}"); //$NON-NLS-1$
        } else {
            if (this.body != null)
                this.body.print(this.body instanceof Block ? tab : 0, output);
            else
                output.append("<@incubator>"); //$NON-NLS-1$
        }
        return output.append(suffix);
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        if (visitor.visit(this)) {
            if (this.arguments != null) {
                int argumentsLength = this.arguments.length;
                for (int i = 0; i < argumentsLength; i++)
                    this.arguments[i].traverse(visitor, ((MethodScope) null));
            }

            if (this.body != null) {
                this.body.traverse(visitor, ((MethodScope) null));
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public CompilationResult compilationResult() {
        return this.compilationResult;
    }

    @Override
    public void abort(int abortLevel, IProblem problem) {
        switch (abortLevel) {
            case 2:
                throw new AbortCompilation(this.compilationResult, problem);

            case 4:
                throw new AbortCompilationUnit(this.compilationResult, problem);

            case 8:
                throw new AbortType(this.compilationResult, problem);

            default:
                throw new AbortMethod(this.compilationResult, problem);
        }
    }

    @Override
    public CompilationUnitDeclaration getCompilationUnitDeclaration() {
        return ((CompilationUnitDeclaration) null);
    }

    @Override
    public boolean hasErrors() {
        return this.ignoreFurtherInvestigation;
    }

    @Override
    public void tagAsHavingErrors() {
        this.ignoreFurtherInvestigation = true;
        Scope parent = ((BlockScope) null).parent;

    }

}
