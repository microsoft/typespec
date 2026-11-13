// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2002, 2021 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.util;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.DefaultErrorHandlingPolicies;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.IProblemFactory;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CompilationUnitDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ConstructorDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.batch.CompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.env.ICompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.ProblemHandler;
import java.util.Map;

/**
 * Utility class to parse different code snippets
 */
public class CodeSnippetParsingUtil {

    public RecordedParsingInformation recordedParsingInformation;

    public CodeSnippetParsingUtil() {

    }

    private RecordedParsingInformation getRecordedParsingInformation(CompilationResult compilationResult,
        int[][] commentPositions) {
        int problemsCount = compilationResult.problemCount;
        IProblem[] problems = null;
        if (problemsCount != 0) {
            final IProblem[] compilationResultProblems = compilationResult.problems;
            if (compilationResultProblems.length == problemsCount) {
                problems = compilationResultProblems;
            } else {
                System.arraycopy(compilationResultProblems, 0, (problems = new IProblem[problemsCount]), 0,
                    problemsCount);
            }
        }
        return new RecordedParsingInformation(problems, compilationResult.getLineSeparatorPositions(),
            commentPositions);
    }

    public ASTNode[] parseClassBodyDeclarations(char[] source, int length, Map<String, String> settings) {

        if (source == null) {
            throw new IllegalArgumentException();
        }
        CompilerOptions compilerOptions = new CompilerOptions(settings);
        compilerOptions.ignoreMethodBodies = false;
        final ProblemHandler problemReporter = new ProblemHandler(DefaultErrorHandlingPolicies.proceedWithAllProblems(),
            compilerOptions, new IProblemFactory());

        CommentRecorderParser parser = new CommentRecorderParser(problemReporter);
        parser.setMethodsFullRecovery();
        parser.setStatementsRecovery();

        ICompilationUnit sourceUnit = new CompilationUnit(source, // $NON-NLS-1$
            compilerOptions.defaultEncoding);

        CompilationResult compilationResult = new CompilationResult(sourceUnit, compilerOptions.maxProblemsPerUnit);
        final CompilationUnitDeclaration compilationUnitDeclaration
            = new CompilationUnitDeclaration(compilationResult, source.length);
        ASTNode[] result = parser.parseClassBodyDeclarations(source, length, compilationUnitDeclaration);

        {
            this.recordedParsingInformation
                = getRecordedParsingInformation(compilationResult, compilationUnitDeclaration.comments);
        }
        return result;
    }

    public Expression parseExpression(char[] source, int length, Map<String, String> settings) {

        if (source == null) {
            throw new IllegalArgumentException();
        }
        CompilerOptions compilerOptions = new CompilerOptions(settings);
        // in this case we don't want to ignore method bodies since we are parsing only an expression
        final ProblemHandler problemReporter = new ProblemHandler(DefaultErrorHandlingPolicies.proceedWithAllProblems(),
            compilerOptions, new IProblemFactory());

        CommentRecorderParser parser = new CommentRecorderParser(problemReporter);

        ICompilationUnit sourceUnit = new CompilationUnit(source, // $NON-NLS-1$
            compilerOptions.defaultEncoding);

        CompilationResult compilationResult = new CompilationResult(sourceUnit, compilerOptions.maxProblemsPerUnit);
        CompilationUnitDeclaration unit = new CompilationUnitDeclaration(compilationResult, source.length);
        Expression result = parser.parseExpression(source, length, unit /* record line separators */);

        {
            this.recordedParsingInformation = getRecordedParsingInformation(compilationResult, unit.comments);
        }
        return result;
    }

    public ConstructorDeclaration parseStatements(char[] source, int length, Map<String, String> settings) {

        if (source == null) {
            throw new IllegalArgumentException();
        }
        CompilerOptions compilerOptions = new CompilerOptions(settings);
        // in this case we don't want to ignore method bodies since we are parsing only statements
        final ProblemHandler problemReporter = new ProblemHandler(DefaultErrorHandlingPolicies.proceedWithAllProblems(),
            compilerOptions, new IProblemFactory());
        CommentRecorderParser parser = new CommentRecorderParser(problemReporter);
        parser.setMethodsFullRecovery();
        parser.setStatementsRecovery();

        ICompilationUnit sourceUnit = new CompilationUnit(source, // $NON-NLS-1$
            compilerOptions.defaultEncoding);

        final CompilationResult compilationResult
            = new CompilationResult(sourceUnit, compilerOptions.maxProblemsPerUnit);
        CompilationUnitDeclaration compilationUnitDeclaration
            = new CompilationUnitDeclaration(compilationResult, length);

        ConstructorDeclaration constructorDeclaration = new ConstructorDeclaration(compilationResult);
        constructorDeclaration.sourceEnd = -1;
        constructorDeclaration.declarationSourceEnd = 0 + length - 1;
        constructorDeclaration.bodyStart = 0;
        constructorDeclaration.bodyEnd = 0 + length - 1;

        parser.scanner.setSource(compilationResult);
        parser.scanner.resetTo(0, 0 + length);
        parser.parse(constructorDeclaration, compilationUnitDeclaration, true);

        {
            this.recordedParsingInformation
                = getRecordedParsingInformation(compilationResult, compilationUnitDeclaration.comments);
        }
        return constructorDeclaration;
    }
}
