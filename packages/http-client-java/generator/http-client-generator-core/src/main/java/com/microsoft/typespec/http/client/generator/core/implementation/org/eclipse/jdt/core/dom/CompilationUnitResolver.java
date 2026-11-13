// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2022 IBM Corporation and others.
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
 *								bug 363858 - [dom] early throwing of AbortCompilation causes NPE in CompilationUnitResolver
 *								Bug 466279 - [hovering] IAE on hover when annotation-based null analysis is enabled
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.DefaultErrorHandlingPolicies;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.IProblemFactory;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CompilationUnitDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.ProblemHandler;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.util.CommentRecorderParser;
import java.util.Map;

public @SuppressWarnings({ "rawtypes", "unchecked" }) abstract class CompilationUnitResolver {

    public static CompilationUnit convert(CompilationUnitDeclaration compilationUnitDeclaration, char[] source,
        Map options) {

        AST ast
            = AST.newAST("enabled".equals(options.get("org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures")));
        String sourceModeSetting = (String) options.get("org.eclipse.jdt.core.compiler.source");
        long sourceLevel = CompilerOptions.versionToJdkLevel(sourceModeSetting);
        if (sourceLevel == 0) {
            // unknown sourceModeSetting
            sourceLevel = 3407872L;
        }
        ast.scanner.sourceLevel = sourceLevel;
        String compliance = (String) options.get("org.eclipse.jdt.core.compiler.compliance");
        long complianceLevel = CompilerOptions.versionToJdkLevel(compliance);
        if (complianceLevel == 0) {
            // unknown sourceModeSetting
            complianceLevel = sourceLevel;
        }
        ast.scanner.complianceLevel = complianceLevel;
        ast.setDefaultNodeFlag(2);
        CompilationUnit compilationUnit;
        ASTConverter converter = new ASTConverter(options);
        converter.setAST(ast);

        compilationUnit = converter.convert(compilationUnitDeclaration, source);
        compilationUnit.setLineEndTable(compilationUnitDeclaration.compilationResult.getLineSeparatorPositions());
        ast.setDefaultNodeFlag(0);
        return compilationUnit;
    }

    public static CompilationUnitDeclaration parse(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.env.ICompilationUnit sourceUnit,
        Map settings) {

        if (sourceUnit == null) {
            throw new IllegalStateException();
        }
        CompilerOptions compilerOptions = new CompilerOptions(settings);

        compilerOptions.performMethodsFullRecovery = false;
        compilerOptions.performStatementsRecovery = false;
        compilerOptions.ignoreMethodBodies = (0 & 8) != 0;
        Parser parser
            = new CommentRecorderParser(new ProblemHandler(DefaultErrorHandlingPolicies.proceedWithAllProblems(),
                compilerOptions, new IProblemFactory()));
        {
        }
        CompilationResult compilationResult = new CompilationResult(sourceUnit, compilerOptions.maxProblemsPerUnit);
        CompilationUnitDeclaration compilationUnitDeclaration = parser.dietParse(sourceUnit, compilationResult);

        if (compilationUnitDeclaration.ignoreMethodBodies) {
            compilationUnitDeclaration.ignoreFurtherInvestigation = true;
            // if initial diet parse did not work, no need to dig into method bodies.
            return compilationUnitDeclaration;
        }

        {
            // fill the methods bodies in order for the code to be generated
            // real parse of the method....
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeDeclaration[] types
                = compilationUnitDeclaration.types;
            if (types != null) {
                for (TypeDeclaration type : types) {
                    type.parseMethods(parser, compilationUnitDeclaration);
                }
            }
        }
        return compilationUnitDeclaration;
    }

}
