// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2025 IBM Corporation and others.
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
 *								Bug 458577 - IClassFile.getWorkingCopy() may lead to NPE in BecomeWorkingCopyOperation
 *******************************************************************************/

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

/*******************************************************************************
 * Copyright (c) 2002, 2009 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.BasicCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblemFactory;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ProblemHandler;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CompilationUnitDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ConstructorDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ExplicitConstructorCall;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.CommentRecorderParser;

/**
 * Parses Java source into abstract syntax trees (ASTs) for the formatter. Sources are always parsed as Java 11, the
 * highest language level of generated code, using the default compiler options with Javadoc support. <p> The
 * resulting AST node is rooted under a {@link CompilationUnit}, which carries the line end table, the
 * {@linkplain CompilationUnit#getProblems() compiler messages}, and the
 * {@linkplain CompilationUnit#getCommentList() comment list}. When a snippet is parsed instead of a compilation unit,
 * that compilation unit and the nodes between it and the result are contrived and have no source positions. </p> <p>
 * Each other node carries the source range of its tokens in the given source; leading and trailing whitespace and
 * comments are not included, except for some body declarations. Source ranges nest properly: the range of a child
 * is within the range of its parent, and sibling ranges do not overlap. Lexical or syntax errors can result in nodes
 * being marked as malformed. </p>
 *
 * @since 3.0
 */
public abstract class ASTParser {

    /**
     * Parses the given source.
     *
     * @param kind the kind of construct to parse: <code>8</code> (compilation unit), <code>128</code> (module
     * description, parsed as a compilation unit named module-info.java), <code>4</code> (class body declarations),
     * <code>2</code> (statements), or <code>1</code> (expression)
     * @param source the source to parse
     * @return for a compilation unit or module description, the {@link CompilationUnit}; for class body declarations,
     * a {@link TypeDeclaration} whose {@link TypeDeclaration#bodyDeclarations() body declarations} are the parsed
     * declarations; for statements, a {@link Block} whose {@link Block#statements() statements} are the parsed
     * statements; or for an expression, the parsed {@link Expression}. When the parser cannot recognize class body
     * declarations or an expression at all, the contrived compilation unit is returned with the compiler messages.
     */
    public static ASTNode createAST(int kind, char[] source) {
        switch (kind) {
            case 8:
            case 128:
                return parseCompilationUnit(source, kind == 128 ? "module-info.java" : "");

            case 4:
            case 2:
            case 1:
                return parseSnippet(kind, source);

            default:
                throw new IllegalArgumentException("Unsupported parse kind: " + kind);
        }
    }

    private static CompilationUnit parseCompilationUnit(char[] source, String fileName) {
        BasicCompilationUnit sourceUnit = new BasicCompilationUnit(source, fileName);
        CommentRecorderParser parser = new CommentRecorderParser(
            new ProblemHandler(false, CompilerOptions.forFormatterInput(), new IProblemFactory()));
        CompilationResult compilationResult = new CompilationResult(sourceUnit);
        CompilationUnitDeclaration compilationUnitDeclaration = parser.dietParse(sourceUnit, compilationResult);

        // parse the method bodies that the diet parse skipped
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration[] types
            = compilationUnitDeclaration.types;
        if (types != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration type : types) {
                type.parseMethods(parser, compilationUnitDeclaration);
            }
        }

        AST ast = AST.newAST();
        ast.scanner.complianceLevel = 3407872L; // the default 1.8 compliance
        ASTConverter converter = new ASTConverter();
        converter.setAST(ast);

        CompilationUnit compilationUnit = converter.convert(compilationUnitDeclaration, source);
        compilationUnit.setLineEndTable(compilationUnitDeclaration.compilationResult.getLineSeparatorPositions());
        return compilationUnit;
    }

    private static ASTNode parseSnippet(int kind, char[] source) {
        final ASTConverter converter = new ASTConverter();
        converter.compilationUnitSource = source;
        converter.compilationUnitSourceLength = source.length;
        converter.scanner.setSource(source);

        AST ast = AST.newAST();

        ast.scanner.previewEnabled = true;
        converter.setAST(ast);
        CompilationUnit compilationUnit = ast.newCompilationUnit();
        int length = source.length;

        CommentRecorderParser parser = new CommentRecorderParser(
            new ProblemHandler(false, CompilerOptions.forFormatterInput(), new IProblemFactory()));
        CompilationResult compilationResult = new CompilationResult(new BasicCompilationUnit(source, ""));
        CompilationUnitDeclaration compilationUnitDeclaration
            = new CompilationUnitDeclaration(compilationResult, length);
        IProblem[] problems;
        switch (kind) {
            case 2: {
                ConstructorDeclaration constructorDeclaration = new ConstructorDeclaration(compilationResult);
                constructorDeclaration.sourceEnd = -1;
                constructorDeclaration.declarationSourceEnd = length - 1;
                constructorDeclaration.bodyStart = 0;
                constructorDeclaration.bodyEnd = length - 1;

                parser.scanner.setSource(compilationResult);
                parser.scanner.resetTo(0, length);
                parser.parse(constructorDeclaration, compilationUnitDeclaration, true);
                problems = recordParsingInformation(converter, compilationUnit, compilationUnitDeclaration);

                Block block = ast.newBlock();
                block.setSourceRange(0, length);
                ExplicitConstructorCall constructorCall = constructorDeclaration.constructorCall;
                if (constructorCall != null && constructorCall.accessMode != 1) {
                    block.statements().add(converter.convert(constructorCall));
                }
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement[] statements
                    = constructorDeclaration.statements;
                if (statements != null) {
                    int statementsLength = statements.length;
                    for (int i = 0; i < statementsLength; i++) {
                        if (statements[i] instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) {
                            converter.checkAndAddMultipleLocalDeclaration(statements, i, block.statements());
                        } else {
                            Statement statement = converter.convert(statements[i]);
                            if (statement != null) {
                                block.statements().add(statement);
                            }
                        }
                    }
                }
                propagateErrors(block, compilationUnit, problems);
                addInitializer(ast, compilationUnit, block);
                return block;
            }

            case 1: {
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression expression
                    = parser.parseExpression(source, length, compilationUnitDeclaration);
                problems = recordParsingInformation(converter, compilationUnit, compilationUnitDeclaration);
                if (expression == null) {
                    break;
                }
                Expression expression2 = converter.convert(expression);
                propagateErrors(expression2, compilationUnit, problems);
                ExpressionStatement expressionStatement = ast.newExpressionStatement(expression2);
                Block block = ast.newBlock();
                block.statements().add(expressionStatement);
                addInitializer(ast, compilationUnit, block);
                return expression2;
            }

            default: {
                final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode[] nodes
                    = parser.parseClassBodyDeclarations(source, length, compilationUnitDeclaration);
                problems = recordParsingInformation(converter, compilationUnit, compilationUnitDeclaration);
                if (nodes == null) {
                    break;
                }
                TypeDeclaration typeDeclaration = converter.convert(nodes);
                typeDeclaration.setSourceRange(0, length);
                propagateErrors(typeDeclaration, compilationUnit, problems);
                compilationUnit.types().add(typeDeclaration);
                return typeDeclaration;
            }
        }
        // the parser could not recognize the snippet
        if (problems != null) {
            compilationUnit.setProblems(problems);
        }
        return compilationUnit;
    }

    /**
     * Records the comments and line ends that the parser found on the compilation unit.
     *
     * @return the problems that the parser reported, or <code>null</code> if there are none
     */
    private static IProblem[] recordParsingInformation(ASTConverter converter, CompilationUnit compilationUnit,
        CompilationUnitDeclaration compilationUnitDeclaration) {
        CompilationResult compilationResult = compilationUnitDeclaration.compilationResult;
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
        int[] lineEnds = compilationResult.getLineSeparatorPositions();
        int[][] comments = compilationUnitDeclaration.comments;
        if (comments != null) {
            converter.buildCommentsTable(compilationUnit, comments);
        }
        compilationUnit.setLineEndTable(lineEnds);
        return problems;
    }

    /**
     * Marks the nodes affected by the given problems as malformed and records the problems on the compilation unit.
     */
    private static void propagateErrors(ASTNode node, CompilationUnit compilationUnit, IProblem[] problems) {
        if (problems != null) {
            node.accept(new ASTSyntaxErrorPropagator(problems));
            compilationUnit.setProblems(problems);
        }
    }

    /**
     * Adds the given block to the compilation unit as the body of an initializer in a contrived type declaration.
     */
    private static void addInitializer(AST ast, CompilationUnit compilationUnit, Block block) {
        TypeDeclaration typeDeclaration = ast.newTypeDeclaration();
        Initializer initializer = ast.newInitializer();
        initializer.setBody(block);
        typeDeclaration.bodyDeclarations().add(initializer);
        compilationUnit.types().add(typeDeclaration);
    }
}
