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
 *     Stephan Herrmann - Contribution for
 *								bug 393719 - [compiler] inconsistent warnings on iteration variables
 *******************************************************************************/

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
 *								Bug 458577 - IClassFile.getWorkingCopy() may lead to NPE in BecomeWorkingCopyOperation
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Argument;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ForeachStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ImportReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IntersectionCastTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MessageSend;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ModuleReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NameReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ParameterizedQualifiedTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ParameterizedSingleTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedAllocationExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Receiver;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SingleTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.StringLiteralConcatenation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SuperReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UnionTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Wildcard;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.TreeSet;
import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Internal class for converting internal compiler ASTs into public ASTs.
 */
class ASTConverter {

    protected AST ast;
    private ASTNode referenceContext;
    protected Comment[] commentsTable;
    char[] compilationUnitSource;
    int compilationUnitSourceLength;
    protected DocCommentParser docParser;
    // comments

    Scanner scanner;

    /**
     * Finds the first line separator used by the given text.
     *
     * @return <code>"\n"</code> or <code>"\r"</code> or <code>"\r\n"</code>, or <code>null</code> if none found
     */
    private static String findLineSeparator(char[] text) {
        // find the first line separator
        int length = text.length;
        if (length > 0) {
            char nextChar = text[0];
            for (int i = 0; i < length; i++) {
                char currentChar = nextChar;
                nextChar = i < length - 1 ? text[i + 1] : ' ';
                switch (currentChar) {
                    case '\n':
                        return "\n"; //$NON-NLS-1$

                    case '\r':
                        return nextChar == '\n' ? "\r\n" : "\r"; //$NON-NLS-1$ //$NON-NLS-2$
                }
            }
        }
        // not found
        return null;
    }

    public ASTConverter() {

        this.referenceContext = null;
        this.scanner = new Scanner(true /* comment */);

    }

    protected void adjustSourcePositionsForParent(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression expression) {
        int start = expression.sourceStart;
        int end = expression.sourceEnd;
        int leftParentCount = 1;
        int rightParentCount = 0;
        this.scanner.resetTo(start, end);
        try {
            this.scanner.getNextToken();
            int token;
            expression.sourceStart = this.scanner.currentPosition;
            boolean stop = false;
            while (!stop && ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF)) {
                switch (token) {
                    case TokenNameLPAREN:
                        leftParentCount++;
                        break;

                    case TokenNameRPAREN:
                        rightParentCount++;
                        if (rightParentCount == leftParentCount) {
                            // we found the matching parenthesis
                            stop = true;
                        }
                        break;

                    default:
                        break;
                }
            }
            expression.sourceEnd = this.scanner.startPosition - 1;
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    protected void buildBodyDeclarations(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration typeDeclaration,
        AbstractTypeDeclaration typeDecl, boolean isInterface) {
        // add body declaration in the lexical order
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration[] members
            = typeDeclaration.memberTypes;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration[] fields
            = typeDeclaration.fields;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration[] methods
            = typeDeclaration.methods;

        int fieldsLength = fields == null ? 0 : fields.length;
        int methodsLength = methods == null ? 0 : methods.length;
        int membersLength = members == null ? 0 : members.length;
        int fieldsIndex = 0;
        int methodsIndex = 0;
        int membersIndex = 0;

        while ((fieldsIndex < fieldsLength) || (membersIndex < membersLength) || (methodsIndex < methodsLength)) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration nextFieldDeclaration
                = null;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration nextMethodDeclaration
                = null;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration nextMemberDeclaration
                = null;

            int position = Integer.MAX_VALUE;
            int nextDeclarationType = -1;
            if (fieldsIndex < fieldsLength) {
                nextFieldDeclaration = fields[fieldsIndex];
                if (nextFieldDeclaration.declarationSourceStart < position) {
                    position = nextFieldDeclaration.declarationSourceStart;
                    nextDeclarationType = 0; // FIELD
                }
            }
            if (methodsIndex < methodsLength) {
                nextMethodDeclaration = methods[methodsIndex];
                if (nextMethodDeclaration.declarationSourceStart < position) {
                    position = nextMethodDeclaration.declarationSourceStart;
                    nextDeclarationType = 1; // METHOD
                }
            }
            if (membersIndex < membersLength) {
                nextMemberDeclaration = members[membersIndex];
                if (nextMemberDeclaration.declarationSourceStart < position) {
                    nextDeclarationType = 2; // MEMBER
                }
            }
            switch (nextDeclarationType) {
                case 0:
                    if (nextFieldDeclaration.getKind() == 3) {
                        typeDecl.bodyDeclarations().add(convert(nextFieldDeclaration));
                    } else {
                        checkAndAddMultipleFieldDeclaration(fields, fieldsIndex, typeDecl.bodyDeclarations());
                    }
                    fieldsIndex++;
                    break;

                case 1:
                    methodsIndex++;
                    if (!nextMethodDeclaration.isDefaultConstructor() && !nextMethodDeclaration.isClinit()) {
                        typeDecl.bodyDeclarations().add(convert(isInterface, nextMethodDeclaration));
                    }
                    break;

                case 2:
                    membersIndex++;
                    typeDecl.bodyDeclarations().add(convert(nextMemberDeclaration));
            }
        }
        // Convert javadoc
        convert(typeDeclaration.javadoc, typeDecl);
    }

    protected void buildBodyDeclarations(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration enumDeclaration2,
        EnumDeclaration enumDeclaration) {
        // add body declaration in the lexical order
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration[] members
            = enumDeclaration2.memberTypes;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration[] fields
            = enumDeclaration2.fields;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration[] methods
            = enumDeclaration2.methods;

        int fieldsLength = fields == null ? 0 : fields.length;
        int methodsLength = methods == null ? 0 : methods.length;
        int membersLength = members == null ? 0 : members.length;
        int fieldsIndex = 0;
        int methodsIndex = 0;
        int membersIndex = 0;

        while ((fieldsIndex < fieldsLength) || (membersIndex < membersLength) || (methodsIndex < methodsLength)) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration nextFieldDeclaration
                = null;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration nextMethodDeclaration
                = null;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration nextMemberDeclaration
                = null;

            int position = Integer.MAX_VALUE;
            int nextDeclarationType = -1;
            if (fieldsIndex < fieldsLength) {
                nextFieldDeclaration = fields[fieldsIndex];
                if (nextFieldDeclaration.declarationSourceStart < position) {
                    position = nextFieldDeclaration.declarationSourceStart;
                    nextDeclarationType = 0; // FIELD
                }
            }
            if (methodsIndex < methodsLength) {
                nextMethodDeclaration = methods[methodsIndex];
                if (nextMethodDeclaration.declarationSourceStart < position) {
                    position = nextMethodDeclaration.declarationSourceStart;
                    nextDeclarationType = 1; // METHOD
                }
            }
            if (membersIndex < membersLength) {
                nextMemberDeclaration = members[membersIndex];
                if (nextMemberDeclaration.declarationSourceStart < position) {
                    nextDeclarationType = 2; // MEMBER
                }
            }
            switch (nextDeclarationType) {
                case 0:
                    if (nextFieldDeclaration.getKind() == 3) {
                        enumDeclaration.enumConstants().add(convert(nextFieldDeclaration));
                    } else {
                        checkAndAddMultipleFieldDeclaration(fields, fieldsIndex, enumDeclaration.bodyDeclarations());
                    }
                    fieldsIndex++;
                    break;

                case 1:
                    methodsIndex++;
                    if (!nextMethodDeclaration.isDefaultConstructor() && !nextMethodDeclaration.isClinit()) {
                        enumDeclaration.bodyDeclarations().add(convert(false, nextMethodDeclaration));
                    }
                    break;

                case 2:
                    membersIndex++;
                    enumDeclaration.bodyDeclarations().add(convert(nextMemberDeclaration));
                    break;
            }
        }
        convert(enumDeclaration2.javadoc, enumDeclaration);
    }

    protected void buildBodyDeclarations(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration expression,
        AnonymousClassDeclaration anonymousClassDeclaration) {
        // add body declaration in the lexical order
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration[] members
            = expression.memberTypes;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration[] fields
            = expression.fields;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration[] methods
            = expression.methods;

        int fieldsLength = fields == null ? 0 : fields.length;
        int methodsLength = methods == null ? 0 : methods.length;
        int membersLength = members == null ? 0 : members.length;
        int fieldsIndex = 0;
        int methodsIndex = 0;
        int membersIndex = 0;

        while ((fieldsIndex < fieldsLength) || (membersIndex < membersLength) || (methodsIndex < methodsLength)) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration nextFieldDeclaration
                = null;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration nextMethodDeclaration
                = null;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration nextMemberDeclaration
                = null;

            int position = Integer.MAX_VALUE;
            int nextDeclarationType = -1;
            if (fieldsIndex < fieldsLength) {
                nextFieldDeclaration = fields[fieldsIndex];
                if (nextFieldDeclaration.declarationSourceStart < position) {
                    position = nextFieldDeclaration.declarationSourceStart;
                    nextDeclarationType = 0; // FIELD
                }
            }
            if (methodsIndex < methodsLength) {
                nextMethodDeclaration = methods[methodsIndex];
                if (nextMethodDeclaration.declarationSourceStart < position) {
                    position = nextMethodDeclaration.declarationSourceStart;
                    nextDeclarationType = 1; // METHOD
                }
            }
            if (membersIndex < membersLength) {
                nextMemberDeclaration = members[membersIndex];
                if (nextMemberDeclaration.declarationSourceStart < position) {
                    nextDeclarationType = 2; // MEMBER
                }
            }
            switch (nextDeclarationType) {
                case 0:
                    if (nextFieldDeclaration.getKind() == 3) {
                        anonymousClassDeclaration.bodyDeclarations().add(convert(nextFieldDeclaration));
                    } else {
                        checkAndAddMultipleFieldDeclaration(fields, fieldsIndex,
                            anonymousClassDeclaration.bodyDeclarations());
                    }
                    fieldsIndex++;
                    break;

                case 1:
                    methodsIndex++;
                    if (!nextMethodDeclaration.isDefaultConstructor() && !nextMethodDeclaration.isClinit()) {
                        anonymousClassDeclaration.bodyDeclarations().add(convert(false, nextMethodDeclaration));
                    }
                    break;

                case 2:
                    membersIndex++;
                    anonymousClassDeclaration.bodyDeclarations().add(convert(nextMemberDeclaration));
            }
        }
    }

    private void checkAndSetMalformed(ASTNode spannedNode, ASTNode spanningNode) {
        if ((spannedNode.getFlags() & 1) != 0) {
            spanningNode.setFlags(spanningNode.getFlags() | 1);
        }
    }

    void buildCommentsTable(CompilationUnit compilationUnit, int[][] comments) {
        // Build comment table
        this.commentsTable = new Comment[comments.length];
        int nbr = 0;
        for (int[] c : comments) {
            Comment comment = createComment(c);
            if (comment != null) {
                this.commentsTable[nbr++] = comment;
            }
        }
        // Resize table if necessary
        if (nbr < comments.length) {
            Comment[] newCommentsTable = new Comment[nbr];
            System.arraycopy(this.commentsTable, 0, newCommentsTable, 0, nbr);
            this.commentsTable = newCommentsTable;
        }
        compilationUnit.setCommentTable(this.commentsTable);
    }

    protected void checkAndAddMultipleFieldDeclaration(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration[] fields,
        int index, List<BodyDeclaration> bodyDeclarations) {
        if (fields[index]instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Initializer oldInitializer) {
            Initializer initializer = new Initializer(this.ast);
            initializer.setBody(convert(oldInitializer.block));
            setModifiers(initializer, oldInitializer);
            initializer.setSourceRange(oldInitializer.declarationSourceStart,
                oldInitializer.sourceEnd - oldInitializer.declarationSourceStart + 1);
            // The javadoc comment is now got from list store in compilation unit declaration
            convert(oldInitializer.javadoc, initializer);
            bodyDeclarations.add(initializer);
            return;
        }
        if (index > 0 && fields[index - 1].declarationSourceStart == fields[index].declarationSourceStart) {
            // we have a multiple field declaration
            // We retrieve the existing fieldDeclaration to add the new VariableDeclarationFragment
            FieldDeclaration fieldDeclaration = (FieldDeclaration) bodyDeclarations.get(bodyDeclarations.size() - 1);
            fieldDeclaration.fragments().add(convertToVariableDeclarationFragment(fields[index]));
        } else {
            // we can create a new FieldDeclaration
            bodyDeclarations.add(convertToFieldDeclaration(fields[index]));
        }
    }

    protected void checkAndAddMultipleLocalDeclaration(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement[] stmts,
        int index, List<Statement> blockStatements) {
        if (index > 0 && stmts[index - 1]instanceof LocalDeclaration local1) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration local2
                = (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) stmts[index];
            if (local1.declarationSourceStart == local2.declarationSourceStart) {
                // we have a multiple local declarations
                // We retrieve the existing VariableDeclarationStatement to add the new VariableDeclarationFragment
                VariableDeclarationStatement variableDeclarationStatement
                    = (VariableDeclarationStatement) blockStatements.get(blockStatements.size() - 1);
                variableDeclarationStatement.fragments()
                    .add(convertToVariableDeclarationFragment(
                        (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) stmts[index]));
            } else {
                // we can create a new FieldDeclaration
                blockStatements.add(convertToVariableDeclarationStatement(
                    (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) stmts[index]));
            }
        } else {
            // we can create a new FieldDeclaration
            blockStatements.add(convertToVariableDeclarationStatement(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) stmts[index]));
        }
    }

    private int checkLength(int start, int end) {
        int len = end - start + 1;
        return Math.max(len, 0);
    }

    public BodyDeclaration convert(boolean isInterface,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration methodDeclaration) {

        if (methodDeclaration instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AnnotationMethodDeclaration) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AnnotationMethodDeclaration) methodDeclaration);
        }
        MethodDeclaration methodDecl = new MethodDeclaration(this.ast);
        ASTNode oldReferenceContext = this.referenceContext;
        this.referenceContext = methodDecl;
        setModifiers(methodDecl, methodDeclaration);
        boolean isConstructor = methodDeclaration.isConstructor();
        methodDecl.setConstructor(isConstructor);
        final SimpleName methodName = new SimpleName(this.ast);
        methodName.internalSetIdentifier(new String(methodDeclaration.selector));
        int start = methodDeclaration.sourceStart;
        int end = retrieveIdentifierEndPosition(start, methodDeclaration.sourceEnd);
        if (end < start)
            end = start + methodDeclaration.selector.length;// naive recovery with method name
        methodName.setSourceRange(start, end - start + 1);
        methodDecl.setName(methodName);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference[] thrownExceptions
            = methodDeclaration.thrownExceptions;
        int methodHeaderEnd = methodDeclaration.sourceEnd;
        int thrownExceptionsLength = thrownExceptions == null ? 0 : thrownExceptions.length;
        if (thrownExceptionsLength > 0) {
            Type thrownExceptionType;
            int i = 0;
            do {
                thrownExceptionType = convertType(thrownExceptions[i++]);
                methodDecl.thrownExceptionTypes().add(thrownExceptionType);
            } while (i < thrownExceptionsLength);
            methodHeaderEnd = thrownExceptionType.getStartPosition() + thrownExceptionType.getLength();
        }

        if (methodDeclaration.receiver != null) {
            convertAndSetReceiver(methodDeclaration, methodDecl);
        }
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Argument[] parameters
            = methodDeclaration.arguments;
        int parametersLength = parameters == null ? 0 : parameters.length;
        if (parametersLength > 0) {
            SingleVariableDeclaration parameter;
            int i = 0;
            do {
                parameter = convert(parameters[i++]);
                methodDecl.parameters().add(parameter);
            } while (i < parametersLength);
            if (thrownExceptionsLength == 0) {
                methodHeaderEnd = parameter.getStartPosition() + parameter.getLength();
            }
        }
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ExplicitConstructorCall explicitConstructorCall
            = null;
        if (isConstructor) {
            if (isInterface) {
                // interface cannot have a constructor
                methodDecl.setFlags(methodDecl.getFlags() | 1);
            }
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ConstructorDeclaration constructorDeclaration
                = (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ConstructorDeclaration) methodDeclaration;
            explicitConstructorCall = constructorDeclaration.constructorCall;
            methodDecl.setReturnType2(null);
        } else if (methodDeclaration instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MethodDeclaration method) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference typeReference
                = method.returnType;
            if (typeReference != null) {
                Type returnType = convertType(typeReference);
                // get the positions of the right parenthesis
                int rightParenthesisPosition = retrieveEndOfRightParenthesisPosition(end, method.bodyEnd);
                int extraDimensions = typeReference.extraDimensions();
                setExtraAnnotatedDimensions(rightParenthesisPosition, method.bodyEnd, typeReference,
                    methodDecl.extraDimensions(), extraDimensions);
                setTypeForMethodDeclaration(methodDecl, returnType, extraDimensions);
            } else {
                // no return type for a method that is not a constructor
                methodDecl.setFlags(methodDecl.getFlags() | 1);
                methodDecl.setReturnType2(null);
            }
        }
        int declarationSourceStart = methodDeclaration.declarationSourceStart;
        int bodyEnd = methodDeclaration.bodyEnd;
        methodDecl.setSourceRange(declarationSourceStart, checkLength(declarationSourceStart, bodyEnd));
        int declarationSourceEnd = methodDeclaration.declarationSourceEnd;
        int rightBraceOrSemiColonPositionStart = bodyEnd == declarationSourceEnd ? bodyEnd : bodyEnd + 1;
        int closingPosition
            = retrieveRightBraceOrSemiColonPosition(rightBraceOrSemiColonPositionStart, declarationSourceEnd);
        if (closingPosition != -1) {
            int startPosition = methodDecl.getStartPosition();
            methodDecl.setSourceRange(startPosition, closingPosition - startPosition + 1);

            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement[] statements
                = methodDeclaration.statements;

            start = retrieveStartBlockPosition(methodHeaderEnd, methodDeclaration.bodyStart);
            if (start == -1)
                start = methodDeclaration.bodyStart; // use recovery position for body start
            end = retrieveRightBrace(methodDeclaration.bodyEnd + 1, declarationSourceEnd);
            Block block = null;
            if (start != -1 && end != -1) {
                /*
                 * start or end can be equal to -1 if we have an interface's method.
                 */
                block = new Block(this.ast);
                block.setSourceRange(start, closingPosition - start + 1);
                methodDecl.setBody(block);
            }
            if (block != null && (statements != null || explicitConstructorCall != null)) {
                if (explicitConstructorCall != null && explicitConstructorCall.accessMode != 1) {
                    block.statements().add(convert(explicitConstructorCall));
                }
                int statementsLength = statements == null ? 0 : statements.length;
                for (int i = 0; i < statementsLength; i++) {
                    com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement astStatement
                        = statements[i];
                    if (astStatement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) {
                        checkAndAddMultipleLocalDeclaration(statements, i, block.statements());
                    } else {
                        final Statement statement = convert(astStatement);
                        if (statement != null) {
                            block.statements().add(statement);
                        }
                    }
                }
            }
            if (block != null) {
                if ((methodDeclaration.modifiers & (1024 | 256)) != 0
                    || (isInterface && ((methodDeclaration.modifiers & (8 | 65536 | (2))) == 0))) {
                    methodDecl.setFlags(methodDecl.getFlags() | 1);
                }
            }
        } else {
            // syntax error in this method declaration
            methodDecl.setFlags(methodDecl.getFlags() | 1);
            if (!methodDeclaration.isNative() && !methodDeclaration.isAbstract()) {
                start = retrieveStartBlockPosition(methodHeaderEnd, bodyEnd);
                if (start == -1)
                    start = methodDeclaration.bodyStart; // use recovery position for body start
                end = methodDeclaration.bodyEnd;
                // try to get the best end position
                IProblem[] problems = methodDeclaration.compilationResult().problems;
                if (problems != null) {
                    for (int i = 0, max = methodDeclaration.compilationResult().problemCount; i < max; i++) {
                        IProblem currentProblem = problems[i];
                        if (currentProblem.getSourceStart() == start && currentProblem.getID() == 1610612976) {
                            end = currentProblem.getSourceEnd();
                            break;
                        }
                    }
                }
                int startPosition = methodDecl.getStartPosition();
                methodDecl.setSourceRange(startPosition, checkLength(startPosition, end));
                if (start != -1 && end != -1) {
                    /*
                     * start or end can be equal to -1 if we have an interface's method.
                     */
                    Block block = new Block(this.ast);
                    block.setSourceRange(start, checkLength(start, end));
                    methodDecl.setBody(block);
                }
            }
        }

        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeParameter[] typeParameters
            = methodDeclaration.typeParameters();
        if (typeParameters != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeParameter typeParameter : typeParameters) {
                methodDecl.typeParameters().add(convert(typeParameter));
            }
        }

        // The javadoc comment is now got from list store in compilation unit declaration
        convert(methodDeclaration.javadoc, methodDecl);

        this.referenceContext = oldReferenceContext;
        return methodDecl;
    }

    public ClassInstanceCreation convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AllocationExpression expression) {
        ClassInstanceCreation classInstanceCreation = new ClassInstanceCreation(this.ast);

        if (expression.typeArguments != null) {
            for (TypeReference typeArgument : expression.typeArguments) {
                classInstanceCreation.typeArguments().add(convertType(typeArgument));
            }
        }
        classInstanceCreation.setType(convertType(expression.type));
        classInstanceCreation.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] arguments
            = expression.arguments;
        if (arguments != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression argument : arguments) {
                classInstanceCreation.arguments().add(convert(argument));
            }
        }
        return classInstanceCreation;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AND_AND_Expression expression) {
        InfixExpression infixExpression = new InfixExpression(this.ast);
        infixExpression.setOperator(InfixExpression.Operator.CONDITIONAL_AND);

        final int expressionOperatorID = (expression.bits & 7936) >> 8;
        if (expression.left instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
            && ((expression.left.bits & 534773760) == 0)) {
            // create an extended string literal equivalent => use the extended operands list
            infixExpression.extendedOperands().add(convert(expression.right));
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression leftOperand
                = expression.left;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression rightOperand;
            do {
                rightOperand
                    = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) leftOperand).right;
                if ((((leftOperand.bits & 7936) >> 8) != expressionOperatorID && ((leftOperand.bits & 534773760) == 0))
                    || ((rightOperand instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
                        && ((rightOperand.bits & 7936) >> 8) != expressionOperatorID)
                        && ((rightOperand.bits & 534773760) == 0))) {
                    List<Expression> extendedOperands = infixExpression.extendedOperands();
                    InfixExpression temp = new InfixExpression(this.ast);

                    temp.setOperator(getOperatorFor(expressionOperatorID));
                    Expression leftSide = convert(leftOperand);
                    temp.setLeftOperand(leftSide);
                    temp.setSourceRange(leftSide.getStartPosition(), leftSide.getLength());
                    int size = extendedOperands.size();
                    for (int i = 0; i < size - 1; i++) {
                        Expression expr = temp;
                        temp = new InfixExpression(this.ast);

                        temp.setLeftOperand(expr);
                        temp.setOperator(getOperatorFor(expressionOperatorID));
                        temp.setSourceRange(expr.getStartPosition(), expr.getLength());
                    }
                    infixExpression = temp;
                    for (int i = 0; i < size; i++) {
                        Expression extendedOperand = extendedOperands.remove(size - 1 - i);
                        temp.setRightOperand(extendedOperand);
                        int startPosition = temp.getLeftOperand().getStartPosition();
                        temp.setSourceRange(startPosition,
                            extendedOperand.getStartPosition() + extendedOperand.getLength() - startPosition);
                        if (temp.getLeftOperand().getNodeType() == 27) {
                            temp = (InfixExpression) temp.getLeftOperand();
                        }
                    }
                    setInfixSourcePositions(infixExpression, expression.sourceStart);

                    return infixExpression;
                }
                infixExpression.extendedOperands().add(0, convert(rightOperand));
                leftOperand
                    = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) leftOperand).left;
            } while (leftOperand instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
                && ((leftOperand.bits & 534773760) == 0));
            Expression leftExpression = convert(leftOperand);
            infixExpression.setLeftOperand(leftExpression);
            infixExpression.setRightOperand(infixExpression.extendedOperands().remove(0));
            setInfixSourcePositions(infixExpression, expression.sourceStart);
            return infixExpression;
        }
        Expression leftExpression = convert(expression.left);
        infixExpression.setLeftOperand(leftExpression);
        infixExpression.setRightOperand(convert(expression.right));
        infixExpression.setOperator(InfixExpression.Operator.CONDITIONAL_AND);
        setInfixSourcePositions(infixExpression, expression.sourceStart);
        return infixExpression;
    }

    private AnnotationTypeDeclaration convertToAnnotationDeclaration(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration typeDeclaration) {

        AnnotationTypeDeclaration typeDecl = this.ast.newAnnotationTypeDeclaration();
        setModifiers(typeDecl, typeDeclaration);
        final SimpleName typeName = new SimpleName(this.ast);
        typeName.internalSetIdentifier(new String(typeDeclaration.name));
        typeName.setSourceRange(typeDeclaration.sourceStart,
            typeDeclaration.sourceEnd - typeDeclaration.sourceStart + 1);
        typeDecl.setName(typeName);
        typeDecl.setSourceRange(typeDeclaration.declarationSourceStart,
            typeDeclaration.bodyEnd - typeDeclaration.declarationSourceStart + 1);

        buildBodyDeclarations(typeDeclaration, typeDecl, false);
        // The javadoc comment is now got from list store in compilation unit declaration

        return typeDecl;
    }

    public AnnotationTypeMemberDeclaration convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AnnotationMethodDeclaration annotationTypeMemberDeclaration) {

        AnnotationTypeMemberDeclaration annotationTypeMemberDeclaration2
            = new AnnotationTypeMemberDeclaration(this.ast);
        setModifiers(annotationTypeMemberDeclaration2, annotationTypeMemberDeclaration);
        final SimpleName methodName = new SimpleName(this.ast);
        methodName.internalSetIdentifier(new String(annotationTypeMemberDeclaration.selector));
        int start = annotationTypeMemberDeclaration.sourceStart;
        int end = retrieveIdentifierEndPosition(start, annotationTypeMemberDeclaration.sourceEnd);
        methodName.setSourceRange(start, end - start + 1);
        annotationTypeMemberDeclaration2.setName(methodName);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference typeReference
            = annotationTypeMemberDeclaration.returnType;
        if (typeReference != null) {
            Type returnType = convertType(typeReference);
            setTypeForMethodDeclaration(annotationTypeMemberDeclaration2, returnType);
        }
        int declarationSourceStart = annotationTypeMemberDeclaration.declarationSourceStart;
        int declarationSourceEnd = annotationTypeMemberDeclaration.bodyEnd;
        annotationTypeMemberDeclaration2.setSourceRange(declarationSourceStart,
            declarationSourceEnd - declarationSourceStart + 1);
        // The javadoc comment is now got from list store in compilation unit declaration
        convert(annotationTypeMemberDeclaration.javadoc, annotationTypeMemberDeclaration2);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression memberValue
            = annotationTypeMemberDeclaration.defaultValue;
        if (memberValue != null) {
            annotationTypeMemberDeclaration2.setDefault(convert(memberValue));
        }

        return annotationTypeMemberDeclaration2;
    }

    private void convertAndSetReceiver(AbstractMethodDeclaration method, MethodDeclaration methodDecl) {
        Receiver receiver = method.receiver;
        if (receiver.qualifyingName != null) {
            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(receiver.qualifyingName.getName()[0]));
            int start = receiver.qualifyingName.sourceStart;
            int nameEnd = receiver.qualifyingName.sourceEnd;
            name.setSourceRange(start, nameEnd - start + 1);
            methodDecl.setReceiverQualifier(name);

        }
        Type type = convertType(receiver.type);
        methodDecl.setReceiverType(type);
        if (receiver.modifiers != 0) {
            methodDecl.setFlags(methodDecl.getFlags() | 1);
        }

    }

    public SingleVariableDeclaration convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Argument argument) {
        SingleVariableDeclaration variableDecl = new SingleVariableDeclaration(this.ast);
        setModifiers(variableDecl.modifiers(), argument);
        final SimpleName name = new SimpleName(this.ast);
        name.internalSetIdentifier(new String(argument.name));
        if (argument instanceof Receiver) {
            name.setFlags(name.getFlags() | 1);
        }
        int start = argument.sourceStart;
        int nameEnd = argument.sourceEnd;
        name.setSourceRange(start, nameEnd - start + 1);
        variableDecl.setName(name);
        final int typeSourceEnd = argument.type.sourceEnd;
        TypeReference typeReference = argument.type;
        final int extraDimensions = typeReference.extraDimensions();
        setExtraAnnotatedDimensions(nameEnd + 1, typeSourceEnd, typeReference, variableDecl.extraDimensions(),
            extraDimensions);
        final boolean isVarArgs = argument.isVarArgs();
        if (isVarArgs && extraDimensions == 0) {
            // remove the ellipsis from the type source end
            argument.type.sourceEnd = retrieveEllipsisStartPosition(argument.type.sourceStart, typeSourceEnd);
        }
        Type type = convertType(argument.type);
        int typeEnd = type.getStartPosition() + type.getLength() - 1;
        int rightEnd = Math.max(typeEnd, argument.declarationSourceEnd);
        /*
         * There is extra work to do to set the proper type positions See PR
         * http://bugs.eclipse.org/bugs/show_bug.cgi?id=23284
         */
        if (isVarArgs) {
            Dimension lastDimension = null;
            if (type.isArrayType()) { // should always be true
                List<Dimension> dimensions = ((ArrayType) type).dimensions();
                if (!dimensions.isEmpty()) {
                    lastDimension = dimensions.get(dimensions.size() - 1);
                }
            }
            setTypeForSingleVariableDeclaration(variableDecl, type, extraDimensions + 1);
            // https://bugs.eclipse.org/bugs/show_bug.cgi?id=391898
            if (lastDimension != null) { // should always be true
                for (Annotation annotation : lastDimension.annotations()) {
                    annotation.setParent(null, null);
                    variableDecl.varargsAnnotations().add(annotation);
                }
            }
            if (extraDimensions != 0) {
                variableDecl.setFlags(variableDecl.getFlags() | 1);
            }
        } else {
            setTypeForSingleVariableDeclaration(variableDecl, type, extraDimensions);
        }
        variableDecl.setSourceRange(argument.declarationSourceStart, rightEnd - argument.declarationSourceStart + 1);

        if (isVarArgs) {
            variableDecl.setVarargs();
        }

        return variableDecl;
    }

    public Annotation convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation annotation) {
        if (annotation instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SingleMemberAnnotation) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SingleMemberAnnotation) annotation);
        } else if (annotation instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MarkerAnnotation) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MarkerAnnotation) annotation);
        } else {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NormalAnnotation) annotation);
        }
    }

    public ArrayCreation convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayAllocationExpression expression) {
        ArrayCreation arrayCreation = new ArrayCreation(this.ast);

        arrayCreation.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] dimensions
            = expression.dimensions;

        int dimensionsLength = dimensions.length;
        for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression value : dimensions) {
            if (value != null) {
                Expression dimension = convert(value);

                arrayCreation.dimensions().add(dimension);
            }
        }
        Type type = convertType(expression.type);

        ArrayType arrayType;
        if (type.isArrayType()) {
            arrayType = (ArrayType) type;
            if (expression.annotationsOnDimensions != null) {
                setTypeAnnotationsAndSourceRangeOnArray(arrayType, expression.annotationsOnDimensions);
            }
        } else {
            arrayType = convertToArray(type, type.getStartPosition(), -1, dimensionsLength,
                expression.annotationsOnDimensions);
        }
        arrayCreation.setType(arrayType);

        if (expression.initializer != null) {
            arrayCreation.setInitializer(convert(expression.initializer));
        }
        return arrayCreation;
    }

    public ArrayInitializer convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayInitializer expression) {
        ArrayInitializer arrayInitializer = new ArrayInitializer(this.ast);

        arrayInitializer.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] expressions
            = expression.expressions;
        if (expressions != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression value : expressions) {
                Expression expr = convert(value);

                arrayInitializer.expressions().add(expr);
            }
        }
        return arrayInitializer;
    }

    public ArrayAccess convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayReference reference) {
        ArrayAccess arrayAccess = new ArrayAccess(this.ast);

        arrayAccess.setSourceRange(reference.sourceStart, reference.sourceEnd - reference.sourceStart + 1);
        arrayAccess.setArray(convert(reference.receiver));
        arrayAccess.setIndex(convert(reference.position));
        return arrayAccess;
    }

    public AssertStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AssertStatement statement) {
        AssertStatement assertStatement = new AssertStatement(this.ast);
        final Expression assertExpression = convert(statement.assertExpression);
        Expression searchingNode = assertExpression;
        assertStatement.setExpression(assertExpression);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression exceptionArgument
            = statement.exceptionArgument;
        if (exceptionArgument != null) {
            final Expression exceptionMessage = convert(exceptionArgument);
            assertStatement.setMessage(exceptionMessage);
            searchingNode = exceptionMessage;
        }
        int start = statement.sourceStart;
        int sourceEnd = retrieveSemiColonPosition(searchingNode);
        if (sourceEnd == -1) {
            sourceEnd = searchingNode.getStartPosition() + searchingNode.getLength() - 1;
            assertStatement.setSourceRange(start, sourceEnd - start + 1);
        } else {
            assertStatement.setSourceRange(start, sourceEnd - start + 1);
        }
        return assertStatement;
    }

    public Assignment convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Assignment expression) {
        Assignment assignment = new Assignment(this.ast);

        Expression lhs = convert(expression.lhs);
        assignment.setLeftHandSide(lhs);
        assignment.setOperator(Assignment.Operator.ASSIGN);
        Expression rightHandSide = convert(expression.expression);
        assignment.setRightHandSide(rightHandSide);
        int start = lhs.getStartPosition();
        int end = rightHandSide.getStartPosition() + rightHandSide.getLength() - 1;
        assignment.setSourceRange(start, end - start + 1);
        return assignment;
    }

    private void getAbstractTypeDeclarationDetails(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode[] nodes,
        final AbstractTypeDeclaration typeDecl) {
        int nodesLength = nodes.length;
        for (int i = 0; i < nodesLength; i++) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode node
                = nodes[i];
            if (node instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Initializer oldInitializer) {
                Initializer initializer = new Initializer(this.ast);
                initializer.setBody(convert(oldInitializer.block));
                setModifiers(initializer, oldInitializer);
                initializer.setSourceRange(oldInitializer.declarationSourceStart,
                    oldInitializer.sourceEnd - oldInitializer.declarationSourceStart + 1);
                convert(oldInitializer.javadoc, initializer);
                typeDecl.bodyDeclarations().add(initializer);
            } else if (node instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration fieldDeclaration) {
                if (i > 0
                    && (nodes[i
                        - 1] instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration)
                    && ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration) nodes[i
                        - 1]).declarationSourceStart == fieldDeclaration.declarationSourceStart) {
                    // we have a multiple field declaration
                    // We retrieve the existing fieldDeclaration to add the new VariableDeclarationFragment
                    FieldDeclaration currentFieldDeclaration
                        = (FieldDeclaration) typeDecl.bodyDeclarations().get(typeDecl.bodyDeclarations().size() - 1);
                    currentFieldDeclaration.fragments().add(convertToVariableDeclarationFragment(fieldDeclaration));
                } else {
                    // we can create a new FieldDeclaration
                    typeDecl.bodyDeclarations().add(convertToFieldDeclaration(fieldDeclaration));
                }
            } else if (node instanceof AbstractMethodDeclaration nextMethodDeclaration) {
                if (!nextMethodDeclaration.isDefaultConstructor() && !nextMethodDeclaration.isClinit()) {
                    typeDecl.bodyDeclarations().add(convert(false, nextMethodDeclaration));
                }
            } else if (node instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration nextMemberDeclaration) {
                typeDecl.bodyDeclarations().add(convert(nextMemberDeclaration));
            }
        }
    }

    /*
     * Internal use only Used to convert class body declarations
     */
    public TypeDeclaration convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode[] nodes) {
        final TypeDeclaration typeDecl = new TypeDeclaration(this.ast);
        ASTNode oldReferenceContext = this.referenceContext;
        this.referenceContext = typeDecl;
        typeDecl.setInterface(false);
        getAbstractTypeDeclarationDetails(nodes, typeDecl);
        this.referenceContext = oldReferenceContext;
        return typeDecl;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression expression) {
        InfixExpression infixExpression = new InfixExpression(this.ast);

        int expressionOperatorID = (expression.bits & 7936) >> 8;
        infixExpression.setOperator(getOperatorFor(expressionOperatorID));

        if (expression.left instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
            && ((expression.left.bits & 534773760) == 0)) {
            // create an extended string literal equivalent => use the extended operands list
            infixExpression.extendedOperands().add(convert(expression.right));
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression leftOperand
                = expression.left;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression rightOperand;
            do {
                rightOperand
                    = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) leftOperand).right;
                if ((((leftOperand.bits & 7936) >> 8) != expressionOperatorID && ((leftOperand.bits & 534773760) == 0))
                    || ((rightOperand instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
                        && ((rightOperand.bits & 7936) >> 8) != expressionOperatorID)
                        && ((rightOperand.bits & 534773760) == 0))) {
                    List<Expression> extendedOperands = infixExpression.extendedOperands();
                    InfixExpression temp = new InfixExpression(this.ast);

                    temp.setOperator(getOperatorFor(expressionOperatorID));
                    Expression leftSide = convert(leftOperand);
                    temp.setLeftOperand(leftSide);
                    temp.setSourceRange(leftSide.getStartPosition(), leftSide.getLength());
                    int size = extendedOperands.size();
                    for (int i = 0; i < size - 1; i++) {
                        Expression expr = temp;
                        temp = new InfixExpression(this.ast);

                        temp.setLeftOperand(expr);
                        temp.setOperator(getOperatorFor(expressionOperatorID));
                        temp.setSourceRange(expr.getStartPosition(), expr.getLength());
                    }
                    infixExpression = temp;
                    for (int i = 0; i < size; i++) {
                        Expression extendedOperand = extendedOperands.remove(size - 1 - i);
                        temp.setRightOperand(extendedOperand);
                        int startPosition = temp.getLeftOperand().getStartPosition();
                        temp.setSourceRange(startPosition,
                            extendedOperand.getStartPosition() + extendedOperand.getLength() - startPosition);
                        if (temp.getLeftOperand().getNodeType() == 27) {
                            temp = (InfixExpression) temp.getLeftOperand();
                        }
                    }
                    setInfixSourcePositions(infixExpression, infixExpression.getLeftOperand().getStartPosition());

                    return infixExpression;
                }
                infixExpression.extendedOperands().add(0, convert(rightOperand));
                leftOperand
                    = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) leftOperand).left;
            } while (leftOperand instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
                && ((leftOperand.bits & 534773760) == 0));
            Expression leftExpression = convert(leftOperand);
            infixExpression.setLeftOperand(leftExpression);
            infixExpression.setRightOperand(infixExpression.extendedOperands().remove(0));
            int startPosition = leftExpression.getStartPosition();
            setInfixSourcePositions(infixExpression, startPosition);
            return infixExpression;
        } else if (expression.left instanceof StringLiteralConcatenation literal
            && ((expression.left.bits & 534773760) == 0)
            && (14 == expressionOperatorID)) {
            final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] stringLiterals
                = literal.getLiterals();
            infixExpression.setLeftOperand(convert(stringLiterals[0]));
            infixExpression.setRightOperand(convert(stringLiterals[1]));
            for (int i = 2; i < stringLiterals.length; i++) {
                infixExpression.extendedOperands().add(convert(stringLiterals[i]));
            }
            infixExpression.extendedOperands().add(convert(expression.right));
            int startPosition = literal.sourceStart;
            setInfixSourcePositions(infixExpression, startPosition);
            return infixExpression;
        }
        Expression leftExpression = convert(expression.left);
        infixExpression.setLeftOperand(leftExpression);
        infixExpression.setRightOperand(convert(expression.right));
        int startPosition = leftExpression.getStartPosition();
        setInfixSourcePositions(infixExpression, startPosition);
        return infixExpression;
    }

    public Block convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Block statement) {
        Block block = new Block(this.ast);
        if (statement.sourceEnd > 0) {
            block.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        }
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement[] statements
            = statement.statements;
        if (statements != null) {
            int statementsLength = statements.length;
            for (int i = 0; i < statementsLength; i++) {
                if (statements[i] instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) {
                    checkAndAddMultipleLocalDeclaration(statements, i, block.statements());
                } else {
                    Statement statement2 = convert(statements[i]);
                    if (statement2 != null) {
                        block.statements().add(statement2);
                    }
                }
            }
        }
        return block;
    }

    public BreakStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BreakStatement statement) {
        BreakStatement breakStatement = new BreakStatement(this.ast);
        breakStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        if (statement.label != null) {
            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(statement.label));
            retrieveIdentifierAndSetPositions(statement.sourceStart, statement.sourceEnd, name);
            breakStatement.setLabel(name);
        }
        return breakStatement;
    }

    public SwitchCase convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CaseStatement statement) {
        SwitchCase switchCase = new SwitchCase(this.ast);
        if (statement.constantExpression != null) {
            switchCase.setExpression(convert(statement.constantExpression));
        }
        switchCase.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        retrieveColonPosition(switchCase);
        return switchCase;
    }

    public CastExpression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CastExpression expression) {
        CastExpression castExpression = new CastExpression(this.ast);
        castExpression.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        TypeReference type = expression.type;
        trimWhiteSpacesAndComments(type);
        castExpression.setType(convertType(type));
        castExpression.setExpression(convert(expression.expression));

        return castExpression;
    }

    public CharacterLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CharLiteral expression) {
        int length = expression.sourceEnd - expression.sourceStart + 1;
        int sourceStart = expression.sourceStart;
        CharacterLiteral literal = new CharacterLiteral(this.ast);

        literal.setSourceRange(sourceStart, length);
        removeLeadingAndTrailingCommentsFromLiteral(literal);
        return literal;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ClassLiteralAccess expression) {
        TypeLiteral typeLiteral = new TypeLiteral(this.ast);

        typeLiteral.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        typeLiteral.setType(convertType(expression.type));
        return typeLiteral;
    }

    public CompilationUnit convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CompilationUnitDeclaration unit,
        char[] source) {
        try {
            this.compilationUnitSource = source;
            this.compilationUnitSourceLength = source.length;
            this.scanner.setSource(source, unit.compilationResult);
            CompilationUnit compilationUnit = new CompilationUnit(this.ast);

            // Parse comments
            int[][] comments = unit.comments;
            if (comments != null) {
                buildCommentsTable(compilationUnit, comments);
            }

            // handle the package declaration immediately
            // There is no node corresponding to the package declaration

            if (unit.currentPackage != null) {
                PackageDeclaration packageDeclaration = convertPackage(unit);
                compilationUnit.setPackage(packageDeclaration);
            }
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ImportReference[] imports
                = unit.imports;
            if (imports != null) {
                for (ImportReference importReference : imports) {
                    compilationUnit.imports().add(convertImport(importReference));
                }
            }

            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ModuleDeclaration mod
                = unit.moduleDeclaration;
            if (mod != null) {
                ModuleDeclaration declaration = convertToModuleDeclaration(mod);
                compilationUnit.setModule(declaration);
            } else {
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration[] types
                    = unit.types;
                if (types != null) {
                    for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration declaration : types) {
                        if (CharOperation.equals(declaration.name, TypeConstants.PACKAGE_INFO_NAME)) {
                            continue;
                        }
                        compilationUnit.types().add(convert(declaration));
                    }
                }
            }
            compilationUnit.setSourceRange(unit.sourceStart, unit.sourceEnd - unit.sourceStart + 1);

            int problemLength = unit.compilationResult.problemCount;
            if (problemLength != 0) {
                IProblem[] resizedProblems;
                final IProblem[] problems = unit.compilationResult.getCUProblems();
                final int realProblemLength = problems.length;
                if (realProblemLength == problemLength) {
                    resizedProblems = problems;
                } else {
                    System.arraycopy(problems, 0, (resizedProblems = new IProblem[realProblemLength]), 0,
                        realProblemLength);
                }
                ASTSyntaxErrorPropagator syntaxErrorPropagator = new ASTSyntaxErrorPropagator(resizedProblems);
                compilationUnit.accept(syntaxErrorPropagator);
                compilationUnit.setProblems(resizedProblems);
            }

            return compilationUnit;
        } catch (IllegalArgumentException e) {
            StringBuilder message = new StringBuilder("Exception occurred during compilation unit conversion:");  //$NON-NLS-1$
            String lineDelimiter = findLineSeparator(source);
            if (lineDelimiter == null)
                lineDelimiter = System.lineSeparator();
            message.append(lineDelimiter);
            message.append("----------------------------------- SOURCE BEGIN -------------------------------------"); //$NON-NLS-1$
            message.append(lineDelimiter);
            message.append(source);
            message.append(lineDelimiter);
            message.append("----------------------------------- SOURCE END -------------------------------------"); //$NON-NLS-1$
            System.err.println("Status ERROR: org.eclipse.jdt.core code=4 " + message + ' ' + e); //$NON-NLS-1$
            throw e;
        }
    }

    public Assignment convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CompoundAssignment expression) {
        Assignment assignment = new Assignment(this.ast);
        Expression lhs = convert(expression.lhs);
        assignment.setLeftHandSide(lhs);
        int start = lhs.getStartPosition();
        assignment.setSourceRange(start, expression.sourceEnd - start + 1);
        switch (expression.operator) {
            case 14:
                assignment.setOperator(Assignment.Operator.PLUS_ASSIGN);
                break;

            case 13:
                assignment.setOperator(Assignment.Operator.MINUS_ASSIGN);
                break;

            case 15:
                assignment.setOperator(Assignment.Operator.TIMES_ASSIGN);
                break;

            case 9:
                assignment.setOperator(Assignment.Operator.DIVIDE_ASSIGN);
                break;

            case 2:
                assignment.setOperator(Assignment.Operator.BIT_AND_ASSIGN);
                break;

            case 3:
                assignment.setOperator(Assignment.Operator.BIT_OR_ASSIGN);
                break;

            case 8:
                assignment.setOperator(Assignment.Operator.BIT_XOR_ASSIGN);
                break;

            case 16:
                assignment.setOperator(Assignment.Operator.REMAINDER_ASSIGN);
                break;

            case 10:
                assignment.setOperator(Assignment.Operator.LEFT_SHIFT_ASSIGN);
                break;

            case 17:
                assignment.setOperator(Assignment.Operator.RIGHT_SHIFT_SIGNED_ASSIGN);
                break;

            case 19:
                assignment.setOperator(Assignment.Operator.RIGHT_SHIFT_UNSIGNED_ASSIGN);
                break;
        }
        assignment.setRightHandSide(convert(expression.expression));

        return assignment;
    }

    public ConditionalExpression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ConditionalExpression expression) {
        ConditionalExpression conditionalExpression = new ConditionalExpression(this.ast);

        conditionalExpression.setExpression(convert(expression.condition));
        conditionalExpression.setThenExpression(convert(expression.valueIfTrue));
        Expression elseExpression = convert(expression.valueIfFalse);
        conditionalExpression.setElseExpression(elseExpression);
        conditionalExpression.setSourceRange(expression.sourceStart,
            elseExpression.getStartPosition() + elseExpression.getLength() - expression.sourceStart);
        return conditionalExpression;
    }

    public ContinueStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ContinueStatement statement) {
        ContinueStatement continueStatement = new ContinueStatement(this.ast);
        continueStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        if (statement.label != null) {
            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(statement.label));
            retrieveIdentifierAndSetPositions(statement.sourceStart, statement.sourceEnd, name);
            continueStatement.setLabel(name);
        }
        return continueStatement;
    }

    public DoStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.DoStatement statement) {
        DoStatement doStatement = new DoStatement(this.ast);
        doStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        doStatement.setExpression(convert(statement.condition));
        final Statement action = convert(statement.action);
        if (action == null)
            return null;
        doStatement.setBody(action);
        return doStatement;
    }

    public NumberLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.DoubleLiteral expression) {
        int length = expression.sourceEnd - expression.sourceStart + 1;
        int sourceStart = expression.sourceStart;
        NumberLiteral literal = new NumberLiteral(this.ast);

        literal.setSourceRange(sourceStart, length);
        removeLeadingAndTrailingCommentsFromLiteral(literal);
        return literal;
    }

    public EmptyStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.EmptyStatement statement) {
        EmptyStatement emptyStatement = new EmptyStatement(this.ast);
        emptyStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        return emptyStatement;
    }

    // field is an enum constant
    public EnumConstantDeclaration convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration enumConstant) {

        EnumConstantDeclaration enumConstantDeclaration = new EnumConstantDeclaration(this.ast);
        final SimpleName typeName = new SimpleName(this.ast);
        typeName.internalSetIdentifier(new String(enumConstant.name));
        typeName.setSourceRange(enumConstant.sourceStart, enumConstant.sourceEnd - enumConstant.sourceStart + 1);
        enumConstantDeclaration.setName(typeName);
        int declarationSourceStart = enumConstant.declarationSourceStart;
        int declarationSourceEnd = enumConstant.declarationSourceEnd;
        final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression initialization
            = enumConstant.initialization;
        if (initialization != null) {
            if (initialization instanceof QualifiedAllocationExpression) {
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration anonymousType
                    = ((QualifiedAllocationExpression) initialization).anonymousType;
                if (anonymousType != null) {
                    AnonymousClassDeclaration anonymousClassDeclaration = new AnonymousClassDeclaration(this.ast);
                    int start = retrieveStartBlockPosition(anonymousType.sourceEnd, anonymousType.bodyEnd);
                    if (start == -1)
                        start = anonymousType.bodyStart;

                    int end = retrieveRightBrace(anonymousType.bodyEnd + 1, declarationSourceEnd);
                    if (end == -1)
                        end = anonymousType.bodyEnd;

                    if (end < start)
                        start = end;

                    anonymousClassDeclaration.setSourceRange(start, end - start + 1);
                    enumConstantDeclaration.setAnonymousClassDeclaration(anonymousClassDeclaration);
                    buildBodyDeclarations(anonymousType, anonymousClassDeclaration);

                    enumConstantDeclaration.setSourceRange(declarationSourceStart, end - declarationSourceStart + 1);
                }
            } else {
                enumConstantDeclaration.setSourceRange(declarationSourceStart,
                    declarationSourceEnd - declarationSourceStart + 1);
            }
            final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] arguments
                = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AllocationExpression) initialization).arguments;
            if (arguments != null) {
                for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression argument : arguments) {
                    enumConstantDeclaration.arguments().add(convert(argument));
                }
            }
        } else {
            enumConstantDeclaration.setSourceRange(declarationSourceStart,
                declarationSourceEnd - declarationSourceStart + 1);
        }
        setModifiers(enumConstantDeclaration, enumConstant);

        convert(enumConstant.javadoc, enumConstantDeclaration);
        return enumConstantDeclaration;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.EqualExpression expression) {
        InfixExpression infixExpression = new InfixExpression(this.ast);

        Expression leftExpression = convert(expression.left);
        infixExpression.setLeftOperand(leftExpression);
        infixExpression.setRightOperand(convert(expression.right));
        int startPosition = leftExpression.getStartPosition();
        setInfixSourcePositions(infixExpression, startPosition);
        switch ((expression.bits & 7936) >> 8) {
            case 18:
                infixExpression.setOperator(InfixExpression.Operator.EQUALS);
                break;

            case 20:
                infixExpression.setOperator(InfixExpression.Operator.NOT_EQUALS);
        }
        return infixExpression;
    }

    public Statement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ExplicitConstructorCall statement) {
        Statement newStatement;
        int sourceStart = statement.sourceStart;
        if (statement.isSuperAccess()) {
            SuperConstructorInvocation superConstructorInvocation = new SuperConstructorInvocation(this.ast);
            if (statement.qualification != null) {
                superConstructorInvocation.setExpression(convert(statement.qualification));
            }
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] arguments
                = statement.arguments;
            if (arguments != null) {
                for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression argument : arguments) {
                    superConstructorInvocation.arguments().add(convert(argument));
                }
            }
            if (statement.typeArguments != null) {
                if (sourceStart > statement.typeArgumentsSourceStart) {
                    sourceStart = statement.typeArgumentsSourceStart;
                }
                for (TypeReference typeArgument : statement.typeArguments) {
                    superConstructorInvocation.typeArguments().add(convertType(typeArgument));
                }
            }
            newStatement = superConstructorInvocation;
        } else {
            Objects.requireNonNull(statement);
            ConstructorInvocation constructorInvocation = new ConstructorInvocation(this.ast);
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] arguments
                = statement.arguments;
            if (arguments != null) {
                for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression argument : arguments) {
                    constructorInvocation.arguments().add(convert(argument));
                }
            }
            if (statement.typeArguments != null) {
                if (sourceStart > statement.typeArgumentsSourceStart) {
                    sourceStart = statement.typeArgumentsSourceStart;
                }
                for (TypeReference typeArgument : statement.typeArguments) {
                    constructorInvocation.typeArguments().add(convertType(typeArgument));
                }
            }
            if (statement.qualification != null) {
                // this is an error
                constructorInvocation.setFlags(constructorInvocation.getFlags() | 1);
            }
            newStatement = constructorInvocation;
        }
        newStatement.setSourceRange(sourceStart, statement.sourceEnd - sourceStart + 1);

        return newStatement;
    }

    private ModulePackageAccess getPackageVisibilityStatement(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.PackageVisibilityStatement pvsStmt,
        ModulePackageAccess stmt) {
        int sourceEnd = pvsStmt.declarationSourceEnd;
        if (pvsStmt.declarationEnd > sourceEnd)
            sourceEnd = pvsStmt.declarationEnd; // TODO: working around a compiler issue
        Name name = getImportName(pvsStmt.pkgRef);
        stmt.setName(name);

        int tmp = sourceEnd;
        if (pvsStmt.targets != null && pvsStmt.targets.length > 0) {
            List<Name> modules = stmt.modules();
            for (ModuleReference moduleRef : pvsStmt.getTargetedModules()) {
                Name target = getName(CharOperation.splitOn('.', moduleRef.moduleName), moduleRef.sourcePositions);
                modules.add(target);
                if (tmp < moduleRef.sourceEnd)
                    tmp = moduleRef.sourceEnd;

            }
        }
        if (tmp > sourceEnd)
            sourceEnd = tmp;
        stmt.setSourceRange(pvsStmt.declarationSourceStart, sourceEnd - pvsStmt.declarationSourceStart + 1);
        return stmt;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression expression) {
        if ((expression.bits & 534773760) != 0) {
            return convertToParenthesizedExpression(expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CastExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CastExpression) expression);
        }
        // switch between all types of expression
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayAllocationExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayAllocationExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedAllocationExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedAllocationExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AllocationExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AllocationExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayInitializer) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayInitializer) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.PrefixExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.PrefixExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.PostfixExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.PostfixExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CompoundAssignment) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CompoundAssignment) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Assignment) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Assignment) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ClassLiteralAccess) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ClassLiteralAccess) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FalseLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FalseLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TrueLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TrueLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NullLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NullLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CharLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CharLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.DoubleLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.DoubleLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FloatLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FloatLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IntLiteralMinValue) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IntLiteralMinValue) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IntLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IntLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LongLiteralMinValue) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LongLiteralMinValue) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LongLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LongLiteral) expression);
        }
        if (expression instanceof StringLiteralConcatenation) {
            return convert((StringLiteralConcatenation) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.StringLiteral) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.StringLiteral) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AND_AND_Expression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AND_AND_Expression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.OR_OR_Expression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.OR_OR_Expression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.EqualExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.EqualExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.InstanceOfExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.InstanceOfExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UnaryExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UnaryExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ConditionalExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ConditionalExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MessageSend) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MessageSend) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Reference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Reference) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LambdaExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LambdaExpression) expression);
        }
        if (expression instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ReferenceExpression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ReferenceExpression) expression);
        }
        return null;
    }

    public BooleanLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FalseLiteral expression) {
        final BooleanLiteral literal = new BooleanLiteral(this.ast);

        literal.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        return literal;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldReference reference) {
        if (reference.receiver.isSuper()) {
            final SuperFieldAccess superFieldAccess = new SuperFieldAccess(this.ast);

            if (reference.receiver instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference) {
                Name qualifier = convert(
                    (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference) reference.receiver);
                superFieldAccess.setQualifier(qualifier);

            }
            final SimpleName simpleName = new SimpleName(this.ast);
            simpleName.internalSetIdentifier(new String(reference.token));
            int sourceStart = (int) (reference.nameSourcePosition >>> 32);
            int length = (int) (reference.nameSourcePosition) - sourceStart + 1;
            simpleName.setSourceRange(sourceStart, length);
            superFieldAccess.setName(simpleName);

            superFieldAccess.setSourceRange(reference.receiver.sourceStart,
                reference.sourceEnd - reference.receiver.sourceStart + 1);
            return superFieldAccess;
        } else {
            final FieldAccess fieldAccess = new FieldAccess(this.ast);

            Expression receiver = convert(reference.receiver);
            fieldAccess.setExpression(receiver);
            final SimpleName simpleName = new SimpleName(this.ast);
            simpleName.internalSetIdentifier(new String(reference.token));
            int sourceStart = (int) (reference.nameSourcePosition >>> 32);
            int length = (int) (reference.nameSourcePosition) - sourceStart + 1;
            simpleName.setSourceRange(sourceStart, length);
            fieldAccess.setName(simpleName);

            fieldAccess.setSourceRange(receiver.getStartPosition(),
                reference.sourceEnd - receiver.getStartPosition() + 1);
            return fieldAccess;
        }
    }

    public NumberLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FloatLiteral expression) {
        int length = expression.sourceEnd - expression.sourceStart + 1;
        int sourceStart = expression.sourceStart;
        NumberLiteral literal = new NumberLiteral(this.ast);

        literal.setSourceRange(sourceStart, length);
        removeLeadingAndTrailingCommentsFromLiteral(literal);
        return literal;
    }

    public Statement convert(ForeachStatement statement) {

        EnhancedForStatement enhancedForStatement = new EnhancedForStatement(this.ast);
        enhancedForStatement.setParameter(convertToSingleVariableDeclaration(statement.elementVariable));
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression collection
            = statement.collection;
        if (collection == null)
            return null;
        enhancedForStatement.setExpression(convert(collection));
        final Statement action = convert(statement.action);
        if (action == null)
            return null;
        enhancedForStatement.setBody(action);
        int start = statement.sourceStart;
        int end = statement.sourceEnd;
        enhancedForStatement.setSourceRange(start, end - start + 1);
        return enhancedForStatement;
    }

    public ForStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ForStatement statement) {
        ForStatement forStatement = new ForStatement(this.ast);
        forStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement[] initializations
            = statement.initializations;
        if (initializations != null) {
            // we know that we have at least one initialization
            if (initializations[0]instanceof LocalDeclaration initialization) {
                VariableDeclarationExpression variableDeclarationExpression
                    = convertToVariableDeclarationExpression(initialization);
                int initializationsLength = initializations.length;
                for (int i = 1; i < initializationsLength; i++) {
                    initialization
                        = (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) initializations[i];
                    variableDeclarationExpression.fragments().add(convertToVariableDeclarationFragment(initialization));
                }
                if (initializationsLength != 1) {
                    int start = variableDeclarationExpression.getStartPosition();
                    int end
                        = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) initializations[initializationsLength
                            - 1]).declarationSourceEnd;
                    variableDeclarationExpression.setSourceRange(start, end - start + 1);
                }
                forStatement.initializers().add(variableDeclarationExpression);
            } else {
                for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement initialization : initializations) {
                    Expression initializer = convertToExpression(initialization);
                    if (initializer != null) {
                        forStatement.initializers().add(initializer);
                    } else {
                        forStatement.setFlags(forStatement.getFlags() | 1);
                    }
                }
            }
        }
        if (statement.condition != null) {
            forStatement.setExpression(convert(statement.condition));
        }
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement[] increments
            = statement.increments;
        if (increments != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement increment : increments) {
                forStatement.updaters().add(convertToExpression(increment));
            }
        }
        final Statement action = convert(statement.action);
        if (action == null)
            return null;
        forStatement.setBody(action);
        return forStatement;
    }

    public IfStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IfStatement statement) {
        IfStatement ifStatement = new IfStatement(this.ast);
        ifStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        ifStatement.setExpression(convert(statement.condition));
        final Statement thenStatement = convert(statement.thenStatement);
        if (thenStatement == null)
            return null;
        ifStatement.setThenStatement(thenStatement);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement statement2
            = statement.elseStatement;
        if (statement2 != null) {
            final Statement elseStatement = convert(statement2);
            if (elseStatement != null) {
                ifStatement.setElseStatement(elseStatement);
            }
        }
        return ifStatement;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.InstanceOfExpression expression) {
        InstanceofExpression instanceOfExpression = new InstanceofExpression(this.ast);

        Expression leftExpression = convert(expression.expression);
        instanceOfExpression.setLeftOperand(leftExpression);
        final Type convertType = convertType(expression.type);
        instanceOfExpression.setRightOperand(convertType);
        int startPosition = leftExpression.getStartPosition();
        int sourceEnd = convertType.getStartPosition() + convertType.getLength() - 1;

        instanceOfExpression.setSourceRange(startPosition, sourceEnd - startPosition + 1);
        return instanceOfExpression;
    }

    public NumberLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IntLiteral expression) {
        int length = expression.sourceEnd - expression.sourceStart + 1;
        int sourceStart = expression.sourceStart;
        final NumberLiteral literal = new NumberLiteral(this.ast);

        literal.setSourceRange(sourceStart, length);
        removeLeadingAndTrailingCommentsFromLiteral(literal);
        return literal;
    }

    public NumberLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IntLiteralMinValue expression) {
        int length = expression.sourceEnd - expression.sourceStart + 1;
        int sourceStart = expression.sourceStart;
        NumberLiteral literal = new NumberLiteral(this.ast);

        literal.setSourceRange(sourceStart, length);
        removeLeadingAndTrailingCommentsFromLiteral(literal);
        return literal;
    }

    public void convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Javadoc javadoc,
        Supplier<Javadoc> getJ, Consumer<Javadoc> setJ) {
        if (getJ.get() == null) {
            Javadoc docComment = convert(javadoc);
            if (docComment != null)
                setJ.accept(docComment);
        }
    }

    /**
     * Returns the comment from the comments table that includes the given position.
     *
     * @param position the position belonging to the looked up comment
     * @return the comment that includes the given position, or <code>null</code> if there is none
     */
    private Comment getComment(int position) {
        Comment[] comments = this.commentsTable;
        if (comments == null || comments.length == 0) {
            return null;
        }
        if (position == 0) {
            return comments[0].getStartPosition() == 0 ? comments[0] : null;
        }
        int bottom = 0, top = comments.length - 1;
        while (bottom <= top) {
            int i = bottom + (top - bottom) / 2;
            Comment comment = comments[i];
            int commentStart = comment.getStartPosition();
            if (position < commentStart) {
                top = i - 1;
            } else if (position >= (commentStart + comment.getLength())) {
                bottom = i + 1;
            } else {
                return comment;
            }
        }
        return null;
    }

    private Javadoc convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Javadoc javadoc) {
        Javadoc docComment = null;
        if (javadoc != null) {
            Comment comment = getComment(javadoc.sourceStart);
            if (comment != null && comment.isDocComment() && comment.getParent() == null) {
                docComment = (Javadoc) comment;
                List<TagElement> docTags = docComment.tags();
                if (!docTags.isEmpty()) {
                    List<ASTNode> fragments = docTags.get(0).fragments();
                    if (!fragments.isEmpty()) {
                        ASTNode prev = fragments.get(0);
                        for (int i = 1; i < fragments.size(); i++) {
                            ASTNode cur = fragments.get(i);
                            if (cur.getStartPosition() <= prev.getStartPosition())
                                cur.setFlags(1);
                            prev = cur;
                        }
                    }
                }

            }
        }
        return docComment;
    }

    public void convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Javadoc javadoc,
        BodyDeclaration bodyDeclaration) {
        convert(javadoc, bodyDeclaration::getJavadoc, bodyDeclaration::setJavadoc);
    }

    public void convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Javadoc javadoc,
        PackageDeclaration packageDeclaration) {

        convert(javadoc, packageDeclaration::getJavadoc, packageDeclaration::setJavadoc);
    }

    public LabeledStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LabeledStatement statement) {
        LabeledStatement labeledStatement = new LabeledStatement(this.ast);
        final int sourceStart = statement.sourceStart;
        labeledStatement.setSourceRange(sourceStart, statement.sourceEnd - sourceStart + 1);
        Statement body = convert(statement.statement);
        if (body == null)
            return null;
        labeledStatement.setBody(body);
        final SimpleName name = new SimpleName(this.ast);
        name.internalSetIdentifier(new String(statement.label));
        name.setSourceRange(sourceStart, statement.labelEnd - sourceStart + 1);
        labeledStatement.setLabel(name);
        return labeledStatement;
    }

    public NumberLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LongLiteral expression) {
        int length = expression.sourceEnd - expression.sourceStart + 1;
        int sourceStart = expression.sourceStart;
        final NumberLiteral literal = new NumberLiteral(this.ast);

        literal.setSourceRange(sourceStart, length);
        removeLeadingAndTrailingCommentsFromLiteral(literal);
        return literal;
    }

    public NumberLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LongLiteralMinValue expression) {
        int length = expression.sourceEnd - expression.sourceStart + 1;
        int sourceStart = expression.sourceStart;
        final NumberLiteral literal = new NumberLiteral(this.ast);

        literal.setSourceRange(sourceStart, length);
        removeLeadingAndTrailingCommentsFromLiteral(literal);
        return literal;
    }

    public Expression convert(MessageSend expression) {
        // will return a MethodInvocation or a SuperMethodInvocation or
        Expression expr;
        int sourceStart = expression.sourceStart;
        if (expression.isSuperAccess()) {
            // returns a SuperMethodInvocation
            final SuperMethodInvocation superMethodInvocation = new SuperMethodInvocation(this.ast);

            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(expression.selector));
            int nameSourceStart = (int) (expression.nameSourcePosition >>> 32);
            int nameSourceLength = ((int) expression.nameSourcePosition) - nameSourceStart + 1;
            name.setSourceRange(nameSourceStart, nameSourceLength);

            superMethodInvocation.setName(name);
            // expression.receiver is either a QualifiedSuperReference or a SuperReference
            // so the casting cannot fail
            if (expression.receiver instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference) {
                Name qualifier = convert(
                    (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference) expression.receiver);
                superMethodInvocation.setQualifier(qualifier);

                sourceStart = qualifier.getStartPosition();
            }
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] arguments
                = expression.arguments;
            if (arguments != null) {
                for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression argument : arguments) {
                    Expression expri = convert(argument);

                    superMethodInvocation.arguments().add(expri);
                }
            }
            final TypeReference[] typeArguments = expression.typeArguments;
            if (typeArguments != null) {
                for (TypeReference typeArgument : typeArguments) {
                    superMethodInvocation.typeArguments().add(convertType(typeArgument));
                }
            }
            expr = superMethodInvocation;
        } else {
            // returns a MethodInvocation
            final MethodInvocation methodInvocation = new MethodInvocation(this.ast);

            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(expression.selector));
            int nameSourceStart = (int) (expression.nameSourcePosition >>> 32);
            int nameSourceLength = ((int) expression.nameSourcePosition) - nameSourceStart + 1;
            name.setSourceRange(nameSourceStart, nameSourceLength);
            methodInvocation.setName(name);

            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] arguments
                = expression.arguments;
            if (arguments != null) {
                for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression argument : arguments) {
                    Expression expri = convert(argument);

                    methodInvocation.arguments().add(expri);
                }
            }
            Expression qualifier;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression receiver
                = expression.receiver;
            if (receiver instanceof MessageSend) {
                if ((receiver.bits & 534773760) != 0) {
                    qualifier = convertToParenthesizedExpression(receiver);
                } else {
                    qualifier = convert((MessageSend) receiver);
                }
            } else {
                qualifier = convert(receiver);
            }
            methodInvocation.setExpression(qualifier);
            if (qualifier != null) {
                sourceStart = qualifier.getStartPosition();
            }
            final TypeReference[] typeArguments = expression.typeArguments;
            if (typeArguments != null) {
                for (TypeReference typeArgument : typeArguments) {
                    methodInvocation.typeArguments().add(convertType(typeArgument));
                }
            }
            expr = methodInvocation;
        }
        expr.setSourceRange(sourceStart, expression.sourceEnd - sourceStart + 1);
        return expr;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LambdaExpression lambda) {

        final LambdaExpression lambdaExpression = new LambdaExpression(this.ast);

        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Argument[] arguments
            = lambda.arguments();
        if (arguments != null) {
            for (Argument argument : arguments) {
                if (argument.type == null) {
                    VariableDeclarationFragment variableDeclarationFragment = new VariableDeclarationFragment(this.ast);
                    SimpleName simpleName = new SimpleName(this.ast);
                    simpleName.internalSetIdentifier(new String(argument.name));
                    int start = argument.sourceStart;
                    int end = argument.sourceEnd;
                    simpleName.setSourceRange(start, end - start + 1);

                    variableDeclarationFragment.setName(simpleName);
                    variableDeclarationFragment.setSourceRange(start, end - start + 1);
                    lambdaExpression.parameters().add(variableDeclarationFragment);
                } else {
                    SingleVariableDeclaration singleVariableDeclaration = convert(argument);
                    lambdaExpression.parameters().add(singleVariableDeclaration);
                }
            }
        }
        final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement body
            = lambda.body();
        if (body instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression) {
            lambdaExpression.setBody(convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression) body));
        } else {
            lambdaExpression.setBody(convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Block) body));
        }
        int sourceStart = lambda.sourceStart;
        lambdaExpression.setSourceRange(sourceStart, lambda.sourceEnd - sourceStart + 1);
        lambdaExpression.setParentheses(lambda.hasParentheses);
        return lambdaExpression;
    }

    public MarkerAnnotation convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MarkerAnnotation annotation) {
        final MarkerAnnotation markerAnnotation = new MarkerAnnotation(this.ast);
        setTypeNameForAnnotation(annotation, markerAnnotation);
        int start = annotation.sourceStart;
        int end = annotation.declarationSourceEnd;
        markerAnnotation.setSourceRange(start, end - start + 1);

        return markerAnnotation;
    }

    public MemberValuePair convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MemberValuePair memberValuePair) {
        final MemberValuePair pair = new MemberValuePair(this.ast);
        final SimpleName simpleName = new SimpleName(this.ast);
        simpleName.internalSetIdentifier(new String(memberValuePair.name));
        int start = memberValuePair.sourceStart;
        int end = memberValuePair.sourceEnd;
        simpleName.setSourceRange(start, end - start + 1);
        pair.setName(simpleName);
        final Expression value = convert(memberValuePair.value);
        pair.setValue(value);
        start = memberValuePair.sourceStart;
        end = value.getStartPosition() + value.getLength() - 1;
        pair.setSourceRange(start, end - start + 1);

        return pair;
    }

    public Name convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NameReference reference) {
        if (reference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedNameReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedNameReference) reference);
        } else {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SingleNameReference) reference);
        }
    }

    public InfixExpression convert(StringLiteralConcatenation expression) {
        final InfixExpression infixExpression = new InfixExpression(this.ast);
        infixExpression.setOperator(InfixExpression.Operator.PLUS);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] stringLiterals
            = expression.getLiterals();
        infixExpression.setLeftOperand(convert(stringLiterals[0]));
        infixExpression.setRightOperand(convert(stringLiterals[1]));
        for (int i = 2; i < stringLiterals.length; i++) {
            infixExpression.extendedOperands().add(convert(stringLiterals[i]));
        }

        infixExpression.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        return infixExpression;
    }

    public NormalAnnotation convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NormalAnnotation annotation) {
        final NormalAnnotation normalAnnotation = new NormalAnnotation(this.ast);
        setTypeNameForAnnotation(annotation, normalAnnotation);

        int start = annotation.sourceStart;
        int end = annotation.declarationSourceEnd;

        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MemberValuePair[] memberValuePairs
            = annotation.memberValuePairs;
        if (memberValuePairs != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MemberValuePair pair : memberValuePairs) {
                MemberValuePair memberValuePair = convert(pair);
                normalAnnotation.values().add(memberValuePair);
            }
        }

        normalAnnotation.setSourceRange(start, end - start + 1);

        return normalAnnotation;
    }

    public NullLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NullLiteral expression) {
        final NullLiteral literal = new NullLiteral(this.ast);

        literal.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        return literal;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.OR_OR_Expression expression) {
        InfixExpression infixExpression = new InfixExpression(this.ast);
        infixExpression.setOperator(InfixExpression.Operator.CONDITIONAL_OR);

        final int expressionOperatorID = (expression.bits & 7936) >> 8;
        if (expression.left instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
            && ((expression.left.bits & 534773760) == 0)) {
            // create an extended string literal equivalent => use the extended operands list
            infixExpression.extendedOperands().add(convert(expression.right));
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression leftOperand
                = expression.left;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression rightOperand;
            do {
                rightOperand
                    = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) leftOperand).right;
                if ((((leftOperand.bits & 7936) >> 8) != expressionOperatorID && ((leftOperand.bits & 534773760) == 0))
                    || ((rightOperand instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
                        && ((rightOperand.bits & 7936) >> 8) != expressionOperatorID)
                        && ((rightOperand.bits & 534773760) == 0))) {
                    List<Expression> extendedOperands = infixExpression.extendedOperands();
                    InfixExpression temp = new InfixExpression(this.ast);

                    temp.setOperator(getOperatorFor(expressionOperatorID));
                    Expression leftSide = convert(leftOperand);
                    temp.setLeftOperand(leftSide);
                    temp.setSourceRange(leftSide.getStartPosition(), leftSide.getLength());
                    int size = extendedOperands.size();
                    for (int i = 0; i < size - 1; i++) {
                        Expression expr = temp;
                        temp = new InfixExpression(this.ast);

                        temp.setLeftOperand(expr);
                        temp.setOperator(getOperatorFor(expressionOperatorID));
                        temp.setSourceRange(expr.getStartPosition(), expr.getLength());
                    }
                    infixExpression = temp;
                    for (int i = 0; i < size; i++) {
                        Expression extendedOperand = extendedOperands.remove(size - 1 - i);
                        temp.setRightOperand(extendedOperand);
                        int startPosition = temp.getLeftOperand().getStartPosition();
                        temp.setSourceRange(startPosition,
                            extendedOperand.getStartPosition() + extendedOperand.getLength() - startPosition);
                        if (temp.getLeftOperand().getNodeType() == 27) {
                            temp = (InfixExpression) temp.getLeftOperand();
                        }
                    }
                    setInfixSourcePositions(infixExpression, expression.sourceStart);

                    return infixExpression;
                }
                infixExpression.extendedOperands().add(0, convert(rightOperand));
                leftOperand
                    = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression) leftOperand).left;
            } while (leftOperand instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BinaryExpression
                && ((leftOperand.bits & 534773760) == 0));
            Expression leftExpression = convert(leftOperand);
            infixExpression.setLeftOperand(leftExpression);
            infixExpression.setRightOperand(infixExpression.extendedOperands().remove(0));
            setInfixSourcePositions(infixExpression, expression.sourceStart);
            return infixExpression;
        }
        Expression leftExpression = convert(expression.left);
        infixExpression.setLeftOperand(leftExpression);
        infixExpression.setRightOperand(convert(expression.right));
        infixExpression.setOperator(InfixExpression.Operator.CONDITIONAL_OR);
        setInfixSourcePositions(infixExpression, expression.sourceStart);
        return infixExpression;
    }

    private void setInfixSourcePositions(InfixExpression infixExpression, int sourceStart) {
        int n = infixExpression.extendedOperands().size();
        Expression rightMostExp
            = n == 0 ? infixExpression.getRightOperand() : infixExpression.extendedOperands().get(n - 1);
        int rightSourceEnd = rightMostExp.getStartPosition() + rightMostExp.getLength() - 1;
        int infixSourceEnd = infixExpression.getStartPosition() + infixExpression.getLength() - 1;
        infixSourceEnd = Math.max(rightSourceEnd, infixSourceEnd);
        infixExpression.setSourceRange(sourceStart, infixSourceEnd - sourceStart + 1);
    }

    public PostfixExpression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.PostfixExpression expression) {
        final PostfixExpression postfixExpression = new PostfixExpression(this.ast);

        postfixExpression.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        postfixExpression.setOperand(convert(expression.lhs));
        return postfixExpression;
    }

    public PrefixExpression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.PrefixExpression expression) {
        final PrefixExpression prefixExpression = new PrefixExpression(this.ast);

        prefixExpression.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        prefixExpression.setOperand(convert(expression.lhs));
        switch (expression.operator) {
            case 14:
                prefixExpression.setOperator(PrefixExpression.Operator.INCREMENT);
                break;

            case 13:
                prefixExpression.setOperator(PrefixExpression.Operator.DECREMENT);
                break;
        }
        return prefixExpression;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedAllocationExpression allocation) {
        final ClassInstanceCreation classInstanceCreation = new ClassInstanceCreation(this.ast);
        if (allocation.enclosingInstance != null) {
            classInstanceCreation.setExpression(convert(allocation.enclosingInstance));
        }
        classInstanceCreation.setType(convertType(allocation.type));
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression[] arguments
            = allocation.arguments;
        if (arguments != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression expression : arguments) {
                Expression argument = convert(expression);

                classInstanceCreation.arguments().add(argument);
            }
        }
        if (allocation.typeArguments != null) {
            for (TypeReference typeArgument : allocation.typeArguments) {
                classInstanceCreation.typeArguments().add(convertType(typeArgument));
            }
        }
        if (allocation.anonymousType != null) {
            int declarationSourceStart = allocation.sourceStart;
            classInstanceCreation.setSourceRange(declarationSourceStart,
                allocation.anonymousType.bodyEnd - declarationSourceStart + 1);
            final AnonymousClassDeclaration anonymousClassDeclaration = new AnonymousClassDeclaration(this.ast);
            int start
                = retrieveStartBlockPosition(allocation.anonymousType.sourceEnd, allocation.anonymousType.bodyEnd);
            anonymousClassDeclaration.setSourceRange(start, allocation.anonymousType.bodyEnd - start + 1);
            classInstanceCreation.setAnonymousClassDeclaration(anonymousClassDeclaration);
            buildBodyDeclarations(allocation.anonymousType, anonymousClassDeclaration);

        } else {
            final int start = allocation.sourceStart;
            classInstanceCreation.setSourceRange(start, allocation.sourceEnd - start + 1);

        }
        return classInstanceCreation;
    }

    public Name convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedNameReference nameReference) {
        return setQualifiedNameNameAndSourceRanges(nameReference.tokens, nameReference.sourcePositions);
    }

    public Name convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference reference) {
        return convert(reference.qualification);
    }

    public ThisExpression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedThisReference reference) {
        final ThisExpression thisExpression = new ThisExpression(this.ast);
        thisExpression.setSourceRange(reference.sourceStart, reference.sourceEnd - reference.sourceStart + 1);
        thisExpression.setQualifier(convert(reference.qualification));

        return thisExpression;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Reference reference) {
        if (reference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NameReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.NameReference) reference);
        }
        if (reference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ThisReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ThisReference) reference);
        }
        if (reference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayReference) reference);
        }
        if (reference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldReference) reference);
        }
        return null; // cannot be reached
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ReferenceExpression reference) {

        Expression result;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression lhs
            = reference.lhs;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference[] arguments
            = reference.typeArguments;
        int start = arguments != null && arguments.length > 0
            ? arguments[arguments.length - 1].sourceEnd + 1
            : reference.lhs.sourceEnd + 1;
        final SimpleName name = new SimpleName(this.ast);
        retrieveIdentifierAndSetPositions(start, reference.sourceEnd, name);
        name.internalSetIdentifier(new String(reference.selector));

        List<Type> typeArguments;
        if (name.getStartPosition() == -1 && name.getIdentifier().equals("<init>")) { // check for "new" //$NON-NLS-1$
            retrieveInitAndSetPositions(start, reference.sourceEnd, name);
            Type type = null;
            if (lhs instanceof TypeReference) {
                type = convertType((TypeReference) lhs);
            } else if (lhs instanceof NameReference) {
                Name typeName = convert((NameReference) lhs);
                SimpleType simpleType = new SimpleType(this.ast);
                simpleType.setName(typeName);

                simpleType.setSourceRange(lhs.sourceStart, lhs.sourceEnd - lhs.sourceStart + 1);
                type = simpleType;
            }
            CreationReference creationReference = new CreationReference(this.ast);
            creationReference.setType(type);
            typeArguments = creationReference.typeArguments();
            result = creationReference;
        } else if (lhs instanceof TypeReference) {
            TypeMethodReference typeMethodReference = new TypeMethodReference(this.ast);
            typeMethodReference.setType(convertType((TypeReference) lhs));
            typeMethodReference.setName(name);
            typeArguments = typeMethodReference.typeArguments();
            result = typeMethodReference;
        } else if (lhs instanceof SuperReference) {
            SuperMethodReference superMethodReference = new SuperMethodReference(this.ast);
            superMethodReference.setName(name);
            typeArguments = superMethodReference.typeArguments();
            result = superMethodReference;
        } else if (lhs instanceof QualifiedSuperReference) {
            SuperMethodReference superMethodReference = new SuperMethodReference(this.ast);
            superMethodReference.setQualifier(convert((QualifiedSuperReference) lhs));
            superMethodReference.setName(name);
            typeArguments = superMethodReference.typeArguments();
            result = superMethodReference;
        } else {
            ExpressionMethodReference expressionMethodReference = new ExpressionMethodReference(this.ast);
            expressionMethodReference.setExpression(convert(lhs));
            typeArguments = expressionMethodReference.typeArguments();
            expressionMethodReference.setName(name);
            result = expressionMethodReference;
        }
        if (typeArguments != null && arguments != null) {
            for (TypeReference argument : arguments) {
                typeArguments.add(convertType(argument));
            }
        }

        int sourceStart = reference.sourceStart;
        result.setSourceRange(sourceStart, reference.sourceEnd - sourceStart + 1);
        return result;
    }

    public ReturnStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ReturnStatement statement) {
        final ReturnStatement returnStatement = new ReturnStatement(this.ast);
        returnStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        if (statement.expression != null) {
            returnStatement.setExpression(convert(statement.expression));
        }
        return returnStatement;
    }

    public SingleMemberAnnotation convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SingleMemberAnnotation annotation) {
        final SingleMemberAnnotation singleMemberAnnotation = new SingleMemberAnnotation(this.ast);
        setTypeNameForAnnotation(annotation, singleMemberAnnotation);
        singleMemberAnnotation.setValue(convert(annotation.memberValue));
        int start = annotation.sourceStart;
        int end = annotation.declarationSourceEnd;
        singleMemberAnnotation.setSourceRange(start, end - start + 1);

        return singleMemberAnnotation;
    }

    public SimpleName convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SingleNameReference nameReference) {
        final SimpleName name = new SimpleName(this.ast);
        name.internalSetIdentifier(new String(nameReference.token));

        name.setSourceRange(nameReference.sourceStart, nameReference.sourceEnd - nameReference.sourceStart + 1);
        return name;
    }

    public Statement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement statement) {
        if (statement instanceof ForeachStatement) {
            return convert((ForeachStatement) statement);
        }
        if (statement instanceof LocalDeclaration localDeclaration) {
            return convertToVariableDeclarationStatement(localDeclaration);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AssertStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AssertStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Block) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Block) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BreakStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.BreakStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ContinueStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ContinueStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CaseStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CaseStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.DoStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.DoStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.EmptyStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.EmptyStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ExplicitConstructorCall) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ExplicitConstructorCall) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ForStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ForStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IfStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.IfStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LabeledStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LabeledStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ReturnStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ReturnStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SwitchStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SwitchStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SynchronizedStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SynchronizedStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ThrowStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ThrowStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TryStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TryStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration) {
            ASTNode result = convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration) statement);
            if (!(result instanceof TypeDeclaration || result instanceof EnumDeclaration)) {
                return createFakeEmptyStatement(statement);
            }
            TypeDeclarationStatement typeDeclarationStatement = new TypeDeclarationStatement(this.ast);
            if (result instanceof TypeDeclaration typeDeclaration) {
                // annotation and enum type declarations are not returned by the parser inside method bodies
                typeDeclarationStatement.setDeclaration(typeDeclaration);
            } else {
                EnumDeclaration enumDeclaration = (EnumDeclaration) result;
                typeDeclarationStatement.setDeclaration(enumDeclaration);
            }
            AbstractTypeDeclaration typeDeclAST3 = typeDeclarationStatement.getDeclaration();
            typeDeclarationStatement.setSourceRange(typeDeclAST3.getStartPosition(), typeDeclAST3.getLength());
            return typeDeclarationStatement;
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.WhileStatement) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.WhileStatement) statement);
        }
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression statement2) {
            final Expression expr = convert(statement2);
            final ExpressionStatement stmt = new ExpressionStatement(this.ast);
            stmt.setExpression(expr);
            int sourceStart = expr.getStartPosition();
            int sourceEnd = statement2.statementEnd;
            stmt.setSourceRange(sourceStart, sourceEnd - sourceStart + 1);
            return stmt;
        }
        return createFakeEmptyStatement(statement);
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.StringLiteral expression) {
        if (expression instanceof StringLiteralConcatenation) {
            return convert((StringLiteralConcatenation) expression);
        }
        StringLiteral literal = new StringLiteral(this.ast);

        literal.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        return literal;
    }

    public SwitchStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SwitchStatement statement) {
        SwitchStatement switchStatement = new SwitchStatement(this.ast);
        switchStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        switchStatement.setExpression(convert(statement.expression));
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement[] statements
            = statement.statements;
        if (statements != null) {
            int statementsLength = statements.length;
            for (int i = 0; i < statementsLength; i++) {
                if (statements[i] instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration) {
                    checkAndAddMultipleLocalDeclaration(statements, i, switchStatement.statements());
                } else {
                    final Statement currentStatement = convert(statements[i]);
                    if (currentStatement != null) {
                        switchStatement.statements().add(currentStatement);
                    }
                }
            }
        }
        return switchStatement;
    }

    public SynchronizedStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SynchronizedStatement statement) {
        SynchronizedStatement synchronizedStatement = new SynchronizedStatement(this.ast);
        synchronizedStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        synchronizedStatement.setBody(convert(statement.block));
        synchronizedStatement.setExpression(convert(statement.expression));
        return synchronizedStatement;
    }

    public Expression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ThisReference reference) {
        if (reference.isImplicitThis()) {
            // There is no source associated with an implicit this
            return null;
        } else if (reference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedSuperReference) reference);
        } else if (reference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedThisReference) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedThisReference) reference);
        } else {
            ThisExpression thisExpression = new ThisExpression(this.ast);
            thisExpression.setSourceRange(reference.sourceStart, reference.sourceEnd - reference.sourceStart + 1);

            return thisExpression;
        }
    }

    public ThrowStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ThrowStatement statement) {
        final ThrowStatement throwStatement = new ThrowStatement(this.ast);
        throwStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        throwStatement.setExpression(convert(statement.exception));
        return throwStatement;
    }

    public BooleanLiteral convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TrueLiteral expression) {
        final BooleanLiteral literal = new BooleanLiteral(this.ast);

        literal.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        return literal;
    }

    public TryStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TryStatement statement) {
        final TryStatement tryStatement = new TryStatement(this.ast);
        tryStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        int resourcesLength = statement.resources.length;
        if (resourcesLength > 0) {
            for (int i = 0; i < resourcesLength; i++) {
                // Java 8 resources declare their variables; a reported variable resource marks the statement malformed
                if (!(statement.resources[i]instanceof LocalDeclaration localDeclaration)) {
                    tryStatement.setFlags(tryStatement.getFlags() | 1);
                    break;
                }
                VariableDeclarationExpression variableDeclarationExpression
                    = convertToVariableDeclarationExpression(localDeclaration);
                int start = variableDeclarationExpression.getStartPosition();
                int end = localDeclaration.declarationEnd;
                variableDeclarationExpression.setSourceRange(start, end - start + 1);
                tryStatement.resources().add(variableDeclarationExpression);
            }
        }
        tryStatement.setBody(convert(statement.tryBlock));
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Argument[] catchArguments
            = statement.catchArguments;
        if (catchArguments != null) {
            int catchArgumentsLength = catchArguments.length;
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Block[] catchBlocks
                = statement.catchBlocks;
            int start = statement.tryBlock.sourceEnd;
            for (int i = 0; i < catchArgumentsLength; i++) {
                CatchClause catchClause = new CatchClause(this.ast);
                int catchClauseSourceStart = retrieveStartingCatchPosition(start, catchArguments[i].sourceStart);
                catchClause.setSourceRange(catchClauseSourceStart,
                    catchBlocks[i].sourceEnd - catchClauseSourceStart + 1);
                catchClause.setBody(convert(catchBlocks[i]));
                catchClause.setException(convert(catchArguments[i]));
                tryStatement.catchClauses().add(catchClause);
                start = catchBlocks[i].sourceEnd;
            }
        }
        if (statement.finallyBlock != null) {
            tryStatement.setFinally(convert(statement.finallyBlock));
        }
        return tryStatement;
    }

    public AbstractTypeDeclaration convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration typeDeclaration) {
        int kind
            = com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration
                .kind(typeDeclaration.modifiers);
        switch (kind) {
            case 3:
                return convertToEnumDeclaration(typeDeclaration);

            case 4:
                return convertToAnnotationDeclaration(typeDeclaration);
        }
        TypeDeclaration typeDecl = new TypeDeclaration(this.ast);
        ASTNode oldReferenceContext = this.referenceContext;
        this.referenceContext = typeDecl;
        if (typeDeclaration.modifiersSourceStart != -1) {
            setModifiers(typeDecl, typeDeclaration);
        }
        boolean isInterface = kind == 2;
        typeDecl.setInterface(isInterface);
        final SimpleName typeName = new SimpleName(this.ast);
        typeName.internalSetIdentifier(new String(typeDeclaration.name));
        typeName.setSourceRange(typeDeclaration.sourceStart,
            typeDeclaration.sourceEnd - typeDeclaration.sourceStart + 1);
        typeDecl.setName(typeName);
        typeDecl.setSourceRange(typeDeclaration.declarationSourceStart,
            typeDeclaration.bodyEnd - typeDeclaration.declarationSourceStart + 1);

        // need to set the superclass and super interfaces here since we cannot distinguish them at
        // the type references level.
        if (typeDeclaration.superclass != null) {
            typeDecl.setSuperclassType(convertType(typeDeclaration.superclass));
        }

        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference[] superInterfaces
            = typeDeclaration.superInterfaces;
        if (superInterfaces != null) {
            for (TypeReference superInterface : superInterfaces) {
                typeDecl.superInterfaceTypes().add(convertType(superInterface));
            }
        }
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeParameter[] typeParameters
            = typeDeclaration.typeParameters;
        if (typeParameters != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeParameter typeParameter : typeParameters) {
                typeDecl.typeParameters().add(convert(typeParameter));
            }
        }

        buildBodyDeclarations(typeDeclaration, typeDecl, isInterface);

        this.referenceContext = oldReferenceContext;
        return typeDecl;
    }

    public TypeParameter convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeParameter typeParameter) {
        final TypeParameter typeParameter2 = new TypeParameter(this.ast);
        final SimpleName simpleName = new SimpleName(this.ast);
        simpleName.internalSetIdentifier(new String(typeParameter.name));
        int start = typeParameter.sourceStart;
        int end = typeParameter.sourceEnd;
        simpleName.setSourceRange(start, end - start + 1);
        typeParameter2.setName(simpleName);
        int annotationsStart = start;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations
            = typeParameter.annotations;
        if (annotations != null) {
            if (annotations[0] != null)
                annotationsStart = annotations[0].sourceStart;
            annotateTypeParameter(typeParameter2, typeParameter.annotations);
        }
        final TypeReference superType = typeParameter.type;
        end = typeParameter.declarationSourceEnd;
        if (superType != null) {
            Type type = convertType(superType);
            typeParameter2.typeBounds().add(type);
            end = type.getStartPosition() + type.getLength() - 1;
        }
        TypeReference[] bounds = typeParameter.bounds;
        if (bounds != null) {
            Type type;
            for (TypeReference bound : bounds) {
                type = convertType(bound);
                typeParameter2.typeBounds().add(type);
                end = type.getStartPosition() + type.getLength() - 1;
            }
        }
        start = Math.min(annotationsStart, typeParameter.declarationSourceStart);
        end = retrieveClosingAngleBracketPosition(end);
        typeParameter2.setSourceRange(start, end - start + 1);

        return typeParameter2;
    }

    public Name convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference typeReference) {
        char[][] typeName = typeReference.getTypeName();
        int length = typeName.length;
        if (length > 1) {
            // QualifiedName
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedTypeReference qualifiedTypeReference
                = (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.QualifiedTypeReference) typeReference;
            final long[] positions = qualifiedTypeReference.sourcePositions;
            return setQualifiedNameNameAndSourceRanges(typeName, positions);
        } else {
            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(typeName[0]));
            name.setSourceRange(typeReference.sourceStart, typeReference.sourceEnd - typeReference.sourceStart + 1);
            name.index = 1;

            return name;
        }
    }

    public PrefixExpression convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UnaryExpression expression) {
        final PrefixExpression prefixExpression = new PrefixExpression(this.ast);

        prefixExpression.setSourceRange(expression.sourceStart, expression.sourceEnd - expression.sourceStart + 1);
        prefixExpression.setOperand(convert(expression.expression));
        switch ((expression.bits & 7936) >> 8) {
            case 14:
                prefixExpression.setOperator(PrefixExpression.Operator.PLUS);
                break;

            case 13:
                prefixExpression.setOperator(PrefixExpression.Operator.MINUS);
                break;

            case 11:
                prefixExpression.setOperator(PrefixExpression.Operator.NOT);
                break;

            case 12:
                prefixExpression.setOperator(PrefixExpression.Operator.COMPLEMENT);
        }
        return prefixExpression;
    }

    public WhileStatement convert(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.WhileStatement statement) {
        final WhileStatement whileStatement = new WhileStatement(this.ast);
        whileStatement.setSourceRange(statement.sourceStart, statement.sourceEnd - statement.sourceStart + 1);
        whileStatement.setExpression(convert(statement.condition));
        final Statement action = convert(statement.action);
        if (action == null)
            return null;
        whileStatement.setBody(action);
        return whileStatement;
    }

    public ImportDeclaration convertImport(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ImportReference importReference) {
        final ImportDeclaration importDeclaration = new ImportDeclaration(this.ast);
        Name name = getImportName(importReference);
        importDeclaration.setName(name);
        importDeclaration.setSourceRange(importReference.declarationSourceStart,
            importReference.declarationEnd - importReference.declarationSourceStart + 1);
        if (importReference.modifiers != 0) {
            // 'static' is the only import modifier
            Modifier newModifier = new Modifier(this.ast);
            newModifier.setSourceRange(importReference.modifiersSourceStart, 6);
            importDeclaration.modifiers().add(newModifier);
        }

        return importDeclaration;
    }

    public Name getImportName(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ImportReference importReference) {
        return getName(importReference.tokens, importReference.sourcePositions);
    }

    private Name getName(final char[][] tokens, final long[] positions) {
        Name name;
        int length = tokens.length;
        if (length > 1) {
            name = setQualifiedNameNameAndSourceRanges(tokens, positions);
        } else {
            name = new SimpleName(this.ast);
            ((SimpleName) name).internalSetIdentifier(new String(tokens[0]));
            final int start = (int) (positions[0] >>> 32);
            final int end = (int) (positions[0]);
            name.setSourceRange(start, end - start + 1);
            name.index = 1;

        }
        return name;
    }

    public PackageDeclaration convertPackage(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.CompilationUnitDeclaration compilationUnitDeclaration) {
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ImportReference importReference
            = compilationUnitDeclaration.currentPackage;
        final PackageDeclaration packageDeclaration = new PackageDeclaration(this.ast);
        final char[][] tokens = importReference.tokens;
        final int length = importReference.tokens.length;
        long[] positions = importReference.sourcePositions;
        if (length > 1) {
            packageDeclaration.setName(setQualifiedNameNameAndSourceRanges(tokens, positions));
        } else {
            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(tokens[0]));
            int start = (int) (positions[0] >>> 32);
            int end = (int) (positions[length - 1]);
            name.setSourceRange(start, end - start + 1);
            name.index = 1;
            packageDeclaration.setName(name);

        }
        packageDeclaration.setSourceRange(importReference.declarationSourceStart,
            importReference.declarationEnd - importReference.declarationSourceStart + 1);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations
            = importReference.annotations;
        if (annotations != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation annotation : annotations) {
                packageDeclaration.annotations().add(convert(annotation));
            }
        }

        // Set javadoc
        convert(compilationUnitDeclaration.javadoc, packageDeclaration);
        return packageDeclaration;
    }

    private ArrayType convertToArray(Type elementType, int sourceStart, int length, int dimensions,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] annotationsOnDimensions) {
        ArrayType arrayType = this.ast.newArrayType(elementType, dimensions);
        if (length > 0)
            arrayType.setSourceRange(sourceStart, length);

        setTypeAnnotationsAndSourceRangeOnArray(arrayType, annotationsOnDimensions);
        return arrayType;
    }

    private EnumDeclaration convertToEnumDeclaration(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration typeDeclaration) {

        // enum declaration cannot be built if the source is not >= 1.5, since enum is then seen as an identifier
        final EnumDeclaration enumDeclaration2 = new EnumDeclaration(this.ast);
        setModifiers(enumDeclaration2, typeDeclaration);
        final SimpleName typeName = new SimpleName(this.ast);
        typeName.internalSetIdentifier(new String(typeDeclaration.name));
        typeName.setSourceRange(typeDeclaration.sourceStart,
            typeDeclaration.sourceEnd - typeDeclaration.sourceStart + 1);
        enumDeclaration2.setName(typeName);
        enumDeclaration2.setSourceRange(typeDeclaration.declarationSourceStart,
            typeDeclaration.bodyEnd - typeDeclaration.declarationSourceStart + 1);

        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference[] superInterfaces
            = typeDeclaration.superInterfaces;
        if (superInterfaces != null) {
            for (TypeReference superInterface : superInterfaces) {
                enumDeclaration2.superInterfaceTypes().add(convertType(superInterface));
            }
        }
        buildBodyDeclarations(typeDeclaration, enumDeclaration2);

        return enumDeclaration2;
    }

    public Expression convertToExpression(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement statement) {
        if (statement instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression) {
            return convert(
                (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression) statement);
        } else {
            return null;
        }
    }

    protected FieldDeclaration convertToFieldDeclaration(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration fieldDecl) {
        VariableDeclarationFragment variableDeclarationFragment = convertToVariableDeclarationFragment(fieldDecl);
        final FieldDeclaration fieldDeclaration = new FieldDeclaration(this.ast);
        fieldDeclaration.fragments().add(variableDeclarationFragment);

        fieldDeclaration.setSourceRange(fieldDecl.declarationSourceStart,
            fieldDecl.declarationEnd - fieldDecl.declarationSourceStart + 1);
        Type type = convertType(fieldDecl.type);
        setTypeForField(fieldDeclaration, type, variableDeclarationFragment.getExtraDimensions());
        setModifiers(fieldDeclaration, fieldDecl);
        convert(fieldDecl.javadoc, fieldDeclaration);
        return fieldDeclaration;
    }

    /**
     * If there is a parsing error causing a recovered module the source positions may be updated only partially. See
     * bug 518843 for a case where this issue occurred. This method provide a safety net with source positions updated
     * even in case of a recovery - if there is no recovery, the source positions will be retained in-tact identical to
     * the compile time ast module node.
     */
    private int getKnownEnd(ModuleDeclaration md, int sourceEnd, int declSourceEnd) {
        int end = retrieveRightBrace(md.getStartPosition() + 1, this.compilationUnitSourceLength);
        end = Math.max(end, sourceEnd);
        end = Math.max(end, declSourceEnd);
        return end;
    }

    public ModuleDeclaration convertToModuleDeclaration(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ModuleDeclaration moduleDeclaration) {

        ModuleDeclaration moduleDecl = this.ast.newModuleDeclaration();
        setAnnotations(moduleDecl, moduleDeclaration); // only annotations
        Name moduleName
            = getName(CharOperation.splitOn('.', moduleDeclaration.moduleName), moduleDeclaration.sourcePositions);
        moduleDecl.setName(moduleName);

        List<ModuleDirective> stmts = moduleDecl.moduleStatements();
        TreeSet<ModuleDirective> tSet = new TreeSet<>(Comparator.comparingInt(ModuleDirective::getStartPosition));
        for (int i = 0; i < moduleDeclaration.exportsCount; ++i) {
            tSet.add(getPackageVisibilityStatement(moduleDeclaration.exports[i], new ExportsDirective(this.ast)));
        }
        for (int i = 0; i < moduleDeclaration.opensCount; ++i) {
            tSet.add(getPackageVisibilityStatement(moduleDeclaration.opens[i], new OpensDirective(this.ast)));
        }
        for (int i = 0; i < moduleDeclaration.requiresCount; ++i) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.RequiresStatement req
                = moduleDeclaration.requires[i];
            ModuleReference moduleRef = req.module;
            RequiresDirective stmt = new RequiresDirective(this.ast);
            Name name = getName(CharOperation.splitOn('.', moduleRef.moduleName), moduleRef.sourcePositions);
            stmt.setName(name);

            setModuleModifiers(req, stmt);
            stmt.setSourceRange(req.declarationSourceStart, req.declarationEnd - req.declarationSourceStart + 1);
            tSet.add(stmt);
        }
        for (int i = 0; i < moduleDeclaration.usesCount; ++i) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UsesStatement usesStatement
                = moduleDeclaration.uses[i];
            UsesDirective stmt = new UsesDirective(this.ast);
            TypeReference usesRef = usesStatement.serviceInterface;
            Name name = convert(usesRef);
            stmt.setName(name);
            stmt.setSourceRange(usesStatement.declarationSourceStart,
                usesStatement.declarationSourceEnd - usesStatement.declarationSourceStart + 1);
            tSet.add(stmt);
        }
        for (int i = 0; i < moduleDeclaration.servicesCount; ++i) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ProvidesStatement pStmt
                = moduleDeclaration.services[i];
            ProvidesDirective stmt = new ProvidesDirective(this.ast);
            stmt.setName(convert(pStmt.serviceInterface));
            TypeReference[] impls = pStmt.implementations;
            for (TypeReference impl : impls) {
                stmt.implementations().add(convert(impl));
            }
            stmt.setSourceRange(pStmt.declarationSourceStart,
                pStmt.declarationSourceEnd - pStmt.declarationSourceStart + 1);
            tSet.add(stmt);
        }
        // The javadoc comment is now got from list store in compilation unit declaration

        stmts.addAll(tSet);
        int end = getKnownEnd(moduleDecl, moduleDeclaration.sourceEnd, moduleDeclaration.declarationSourceEnd);
        moduleDecl.setSourceRange(moduleDeclaration.declarationSourceStart,
            end - moduleDeclaration.declarationSourceStart + 1);
        return moduleDecl;
    }

    private void setModuleModifiers(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.RequiresStatement req,
        RequiresDirective stmt) {
        boolean fakeInModule = this.scanner.fakeInModule;
        this.scanner.fakeInModule = true;
        this.scanner.resetTo(req.declarationSourceStart, req.sourceEnd);
        try {
            int token;
            ModuleModifier modifier;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNamestatic, TokenNametransitive:
                        modifier = createModuleModifier();
                        break;

                    default:
                        continue;
                }
                stmt.modifiers().add(modifier);
            }
        } catch (InvalidInputException e) {
            // ignore
        } finally {
            this.scanner.fakeInModule = fakeInModule;
        }
    }

    public ParenthesizedExpression convertToParenthesizedExpression(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression expression) {
        final ParenthesizedExpression parenthesizedExpression = new ParenthesizedExpression(this.ast);

        parenthesizedExpression.setSourceRange(expression.sourceStart,
            expression.sourceEnd - expression.sourceStart + 1);
        adjustSourcePositionsForParent(expression);
        trimWhiteSpacesAndComments(expression);
        // decrement the number of parenthesis
        int numberOfParenthesis = (expression.bits & 534773760) >> 21;
        expression.bits &= ~534773760;
        expression.bits |= (numberOfParenthesis - 1) << 21;
        parenthesizedExpression.setExpression(convert(expression));
        return parenthesizedExpression;
    }

    protected VariableDeclarationExpression convertToVariableDeclarationExpression(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration localDeclaration) {
        final VariableDeclarationFragment variableDeclarationFragment
            = convertToVariableDeclarationFragment(localDeclaration);
        final VariableDeclarationExpression variableDeclarationExpression = new VariableDeclarationExpression(this.ast);
        variableDeclarationExpression.fragments().add(variableDeclarationFragment);

        variableDeclarationExpression.setSourceRange(localDeclaration.declarationSourceStart,
            localDeclaration.declarationSourceEnd - localDeclaration.declarationSourceStart + 1);
        Type type = convertType(localDeclaration.type);
        setTypeForVariableDeclarationExpression(variableDeclarationExpression, type,
            variableDeclarationFragment.getExtraDimensions());
        if (localDeclaration.modifiersSourceStart != -1) {
            setModifiers(variableDeclarationExpression.modifiers(), localDeclaration);
        }
        return variableDeclarationExpression;
    }

    protected SingleVariableDeclaration convertToSingleVariableDeclaration(LocalDeclaration localDeclaration) {
        final SingleVariableDeclaration variableDecl = new SingleVariableDeclaration(this.ast);
        setModifiers(variableDecl.modifiers(), localDeclaration);
        final SimpleName name = new SimpleName(this.ast);
        name.internalSetIdentifier(new String(localDeclaration.name));
        int start = localDeclaration.sourceStart;
        int nameEnd = localDeclaration.sourceEnd;
        name.setSourceRange(start, nameEnd - start + 1);
        variableDecl.setName(name);
        TypeReference typeReference = localDeclaration.type;
        final int extraDimensions = typeReference.extraDimensions();
        setExtraAnnotatedDimensions(nameEnd + 1, localDeclaration.declarationSourceEnd, typeReference,
            variableDecl.extraDimensions(), extraDimensions);
        Type type = convertType(localDeclaration.type);
        int typeEnd = type.getStartPosition() + type.getLength() - 1;
        // https://bugs.eclipse.org/393719 - [compiler] inconsistent warnings on iteration variables
        // compiler considers collectionExpression as within the declarationSourceEnd, DOM AST must use the shorter
        // range to avoid overlap
        int sourceEnd
            = ((localDeclaration.bits & 16) != 0) ? localDeclaration.sourceEnd : localDeclaration.declarationSourceEnd;
        int rightEnd = Math.max(typeEnd, sourceEnd);
        /*
         * There is extra work to do to set the proper type positions See PR
         * http://bugs.eclipse.org/bugs/show_bug.cgi?id=23284
         */
        setTypeForSingleVariableDeclaration(variableDecl, type, extraDimensions);
        variableDecl.setSourceRange(localDeclaration.declarationSourceStart,
            rightEnd - localDeclaration.declarationSourceStart + 1);

        return variableDecl;
    }

    private Dimension convertToDimensions(int start, int end,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotation) {
        int length = annotation == null ? 0 : annotation.length;
        Dimension dimension = this.ast.newDimension();
        for (int i = 0; i < length; i++) {
            Annotation annot = convert(annotation[i]);
            dimension.annotations().add(annot);
        }
        retrieveDimensionAndSetPositions(start, end, dimension);
        return dimension;
    }

    protected VariableDeclarationFragment convertToVariableDeclarationFragment(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration fieldDeclaration) {
        final VariableDeclarationFragment variableDeclarationFragment = new VariableDeclarationFragment(this.ast);
        final SimpleName name = new SimpleName(this.ast);
        name.internalSetIdentifier(new String(fieldDeclaration.name));
        name.setSourceRange(fieldDeclaration.sourceStart,
            fieldDeclaration.sourceEnd - fieldDeclaration.sourceStart + 1);
        variableDeclarationFragment.setName(name);
        int start = fieldDeclaration.sourceEnd;
        int end;
        TypeReference typeReference = fieldDeclaration.type;
        int extraDimensions = typeReference.extraDimensions();
        setExtraAnnotatedDimensions(fieldDeclaration.sourceEnd + 1, fieldDeclaration.declarationSourceEnd,
            typeReference, variableDeclarationFragment.extraDimensions(), extraDimensions);
        if (fieldDeclaration.initialization != null) {
            final Expression expression = convert(fieldDeclaration.initialization);
            variableDeclarationFragment.setInitializer(expression);
            start = expression.getStartPosition() + expression.getLength();
            end = start - 1;
        } else {
            // we need to do it even if extendedDimension is null in case of syntax error in an array initializer
            // need the exclusive range for retrieveEndOfPotentialExtendedDimensions
            int possibleEnd = retrieveEndOfPotentialExtendedDimensions(start + 1, fieldDeclaration.sourceEnd,
                fieldDeclaration.declarationSourceEnd);
            if (possibleEnd == Integer.MIN_VALUE) {
                variableDeclarationFragment.setFlags(variableDeclarationFragment.getFlags() | 1);
            }
            if (possibleEnd < 0) {
                end = -possibleEnd;
                variableDeclarationFragment.setFlags(variableDeclarationFragment.getFlags() | 1);
            } else {
                end = possibleEnd;
            }
        }
        variableDeclarationFragment.setSourceRange(fieldDeclaration.sourceStart,
            end - fieldDeclaration.sourceStart + 1);

        return variableDeclarationFragment;
    }

    protected VariableDeclarationFragment convertToVariableDeclarationFragment(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration localDeclaration) {
        final VariableDeclarationFragment variableDeclarationFragment = new VariableDeclarationFragment(this.ast);
        final SimpleName name = new SimpleName(this.ast);
        name.internalSetIdentifier(new String(localDeclaration.name));
        name.setSourceRange(localDeclaration.sourceStart,
            localDeclaration.sourceEnd - localDeclaration.sourceStart + 1);
        variableDeclarationFragment.setName(name);
        int start = localDeclaration.sourceEnd;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression initialization
            = localDeclaration.initialization;
        TypeReference typeReference;
        int extraDimension;
        if (localDeclaration.type != null) {
            typeReference = localDeclaration.type;
            extraDimension = typeReference.extraDimensions();
        } else {
            typeReference = null;
            extraDimension = 0;
        }

        setExtraAnnotatedDimensions(localDeclaration.sourceEnd + 1, this.compilationUnitSourceLength, typeReference,
            variableDeclarationFragment.extraDimensions(), extraDimension);

        boolean hasInitialization = initialization != null;
        int end;
        if (hasInitialization) {
            final Expression expression = convert(initialization);
            variableDeclarationFragment.setInitializer(expression);
            start = expression.getStartPosition() + expression.getLength();
            end = start - 1;
        } else {
            // we need to do it even if extendedDimension is null in case of syntax error in an array initializer
            // start + 1 because we need the exclusive range for retrieveEndOfPotentialExtendedDimensions
            int possibleEnd = retrieveEndOfPotentialExtendedDimensions(start + 1, localDeclaration.sourceEnd,
                localDeclaration.declarationSourceEnd);
            if (possibleEnd == Integer.MIN_VALUE) {
                end = start;
                variableDeclarationFragment.setFlags(variableDeclarationFragment.getFlags() | 1);
            } else if (possibleEnd < 0) {
                end = -possibleEnd;
                variableDeclarationFragment.setFlags(variableDeclarationFragment.getFlags() | 1);
            } else {
                end = possibleEnd;
            }
        }
        variableDeclarationFragment.setSourceRange(localDeclaration.sourceStart,
            end - localDeclaration.sourceStart + 1);

        return variableDeclarationFragment;
    }

    protected void setExtraAnnotatedDimensions(int start, int end, TypeReference type,
        final List<Dimension> extraAnnotatedDimensions, int extraDimension) {
        if (extraDimension > 0) {
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] annotationsOnDims
                = type.getAnnotationsOnDimensions();
            int length = (annotationsOnDims == null) ? 0 : annotationsOnDims.length;
            for (int i = (length - extraDimension); i < length; i++) {
                Dimension dim
                    = convertToDimensions(start, end, (annotationsOnDims == null) ? null : annotationsOnDims[i]);
                extraAnnotatedDimensions.add(dim);
                start = dim.getStartPosition() + dim.getLength();
            }
        }
    }

    private void setTypeAnnotationsOnDimension(Dimension currentDimension,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] annotationsOnDimensions,
        int dimension) {
        if (annotationsOnDimensions == null)
            return;
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations
            = annotationsOnDimensions[dimension];
        if (annotations != null) {
            for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation a : annotations) {
                Annotation annotation = convert(a);
                currentDimension.annotations().add(annotation);
            }
        }
    }

    private void setTypeAnnotationsAndSourceRangeOnArray(ArrayType arrayType,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] annotationsOnDimensions) {
        List<Dimension> dimensions = arrayType.dimensions();
        Type elementType = arrayType.getElementType();

        // Object[] a
        // ^
        int start = elementType.getStartPosition();

        // Object[] a
        // ^
        int startArray = start + elementType.getLength();

        // Object[] a
        // ^
        int end = retrieveProperRightBracketPosition(dimensions.size(), startArray);
        if (end == -1) {
            end = startArray - 1;
        }
        arrayType.setSourceRange(start, end - start + 1);

        start = startArray;
        for (int i = 0; i < dimensions.size(); i++) {
            Dimension currentDimension = dimensions.get(i);
            setTypeAnnotationsOnDimension(currentDimension, annotationsOnDimensions, i);
            retrieveDimensionAndSetPositions(start, end, currentDimension);
            start = currentDimension.getStartPosition() + currentDimension.getLength();
        }
    }

    protected VariableDeclarationStatement convertToVariableDeclarationStatement(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration localDeclaration) {
        final VariableDeclarationFragment variableDeclarationFragment
            = convertToVariableDeclarationFragment(localDeclaration);
        final VariableDeclarationStatement variableDeclarationStatement = new VariableDeclarationStatement(this.ast);
        variableDeclarationStatement.fragments().add(variableDeclarationFragment);
        variableDeclarationStatement.setSourceRange(localDeclaration.declarationSourceStart,
            localDeclaration.declarationSourceEnd - localDeclaration.declarationSourceStart + 1);
        Type type = convertType(localDeclaration.type);
        setTypeForVariableDeclarationStatement(variableDeclarationStatement, type,
            variableDeclarationFragment.getExtraDimensions());

        if (localDeclaration.modifiersSourceStart != -1) {
            setModifiers(variableDeclarationStatement.modifiers(), localDeclaration);
        }
        return variableDeclarationStatement;
    }

    private int annotateType(AnnotatableType type,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations) {
        int annotationsEnd = 0;
        if (annotations == null)
            return annotationsEnd;
        int start = type.getStartPosition();
        int length = type.getLength();
        for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation typeAnnotation : annotations) {
            if (typeAnnotation != null) {
                Annotation annotation = convert(typeAnnotation);
                type.annotations().add(annotation);
                annotationsEnd = annotation.getStartPosition() + annotation.getLength();
            }
        }
        int annotationsStart;
        if (annotations[0] != null && (annotationsStart = annotations[0].sourceStart) < start && annotationsStart > 0) {
            length += start - annotationsStart;
            start = annotationsStart;
        }
        type.setSourceRange(start, length);
        return annotationsEnd;
    }

    private void annotateTypeParameter(TypeParameter typeParameter,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations) {
        for (com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation typeAnnotation : annotations) {
            if (typeAnnotation != null) {
                Annotation annotation = convert(typeAnnotation);
                typeParameter.modifiers().add(annotation);
            }
        }
    }

    public Type convertType(TypeReference typeReference) {
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations;
        if (typeReference instanceof Wildcard wildcard) {
            final WildcardType wildcardType = new WildcardType(this.ast);
            if (wildcard.bound != null) {
                final Type bound = convertType(wildcard.bound);
                wildcardType.setBound(bound);
                int start = wildcard.sourceStart;
                wildcardType.setSourceRange(start, bound.getStartPosition() + bound.getLength() - start);
            } else {
                final int start = wildcard.sourceStart;
                final int end = wildcard.sourceEnd;
                wildcardType.setSourceRange(start, end - start + 1);
            }

            if (typeReference.annotations != null && (annotations = typeReference.annotations[0]) != null) {
                annotateType(wildcardType, annotations);
            }
            return wildcardType;
        }
        Type type = null;
        int sourceStart = typeReference.sourceStart;
        int length;
        int dimensions = typeReference.dimensions();
        if (typeReference instanceof com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.SingleTypeReference) {
            annotations = typeReference.annotations != null ? typeReference.annotations[0] : null;
            int annotationsEnd
                = annotations != null ? annotations[annotations.length - 1].declarationSourceEnd + 1 : -1;
            // this is either an ArrayTypeReference or a SingleTypeReference
            char[] name = typeReference.getTypeName()[0];
            length = typeReference.sourceEnd - typeReference.sourceStart + 1;
            // need to find out if this is an array type of primitive types or not
            if (isPrimitiveType(name)) {
                int[] positions
                    = retrieveEndOfElementTypeNamePosition(Math.max(sourceStart, annotationsEnd), sourceStart + length);
                int end = positions[1];
                if (end == -1) {
                    end = sourceStart + length - 1;
                }
                final PrimitiveType primitiveType = new PrimitiveType(this.ast);
                primitiveType.setPrimitiveTypeCode(getPrimitiveTypeCode(name));
                primitiveType.setSourceRange(sourceStart, end - sourceStart + 1);
                type = primitiveType;
                if (typeReference.annotations != null && (annotations = typeReference.annotations[0]) != null) {
                    annotateType(primitiveType, annotations);
                }
            } else if (typeReference instanceof ParameterizedSingleTypeReference parameterizedSingleTypeReference) {
                final SimpleName simpleName = new SimpleName(this.ast);
                simpleName.internalSetIdentifier(new String(name));
                int[] positions
                    = retrieveEndOfElementTypeNamePosition(Math.max(sourceStart, annotationsEnd), sourceStart + length);
                int end = positions[1];
                if (end == -1) {
                    end = sourceStart + length - 1;
                }
                if (positions[0] != -1) {
                    simpleName.setSourceRange(positions[0], end - positions[0] + 1);
                } else {
                    simpleName.setSourceRange(sourceStart, end - sourceStart + 1);
                }

                SimpleType simpleType;
                simpleType = new SimpleType(this.ast);
                simpleType.setName(simpleName);
                simpleType.setSourceRange(simpleName.getStartPosition(), simpleName.getLength());
                if (typeReference.annotations != null && (annotations = typeReference.annotations[0]) != null) {
                    annotateType(simpleType, annotations);
                }
                int newSourceStart = simpleType.getStartPosition();
                if (newSourceStart > 0 && newSourceStart < sourceStart)
                    sourceStart = newSourceStart;
                final ParameterizedType parameterizedType = new ParameterizedType(this.ast);
                parameterizedType.setType(simpleType);
                type = parameterizedType;
                TypeReference[] typeArguments = parameterizedSingleTypeReference.typeArguments;
                Type type2;
                for (TypeReference typeArgument : typeArguments) {
                    type2 = convertType(typeArgument);
                    ((ParameterizedType) type).typeArguments().add(type2);
                    end = type2.getStartPosition() + type2.getLength() - 1;
                }
                end = retrieveClosingAngleBracketPosition(end + 1);
                type.setSourceRange(sourceStart, end - sourceStart + 1);

            } else {
                final SimpleName simpleName = new SimpleName(this.ast);
                simpleName.internalSetIdentifier(new String(name));
                // we need to search for the starting position of the first brace in order to set the proper length
                // PR http://dev.eclipse.org/bugs/show_bug.cgi?id=10759
                int[] positions
                    = retrieveEndOfElementTypeNamePosition(Math.max(sourceStart, annotationsEnd), sourceStart + length);
                int end = positions[1];
                if (end == -1) {
                    end = sourceStart + length - 1;
                }
                if (positions[0] != -1) {
                    simpleName.setSourceRange(positions[0], end - positions[0] + 1);
                } else {
                    simpleName.setSourceRange(sourceStart, end - sourceStart + 1);
                }
                final SimpleType simpleType = new SimpleType(this.ast);
                simpleType.setName(simpleName);
                type = simpleType;
                type.setSourceRange(sourceStart, end - sourceStart + 1);
                if (typeReference.annotations != null && (annotations = typeReference.annotations[0]) != null) {
                    annotateType(simpleType, annotations);
                }
            }
        } else {
            if (typeReference instanceof ParameterizedQualifiedTypeReference parameterizedQualifiedTypeReference) {
                char[][] tokens = parameterizedQualifiedTypeReference.tokens;
                TypeReference[][] typeArguments = parameterizedQualifiedTypeReference.typeArguments;
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] typeAnnotations
                    = parameterizedQualifiedTypeReference.annotations;
                TypeReference[] arguments;
                int lenth = tokens.length;
                int firstTypeIndex = lenth - 1;
                long[] positions = parameterizedQualifiedTypeReference.sourcePositions;
                boolean isTypeArgumentBased = false;
                for (int i = 0; i < lenth; ++i) {
                    if (typeArguments[i] != null) {
                        firstTypeIndex = i;
                        isTypeArgumentBased = true;
                        break;
                    }
                    if (typeAnnotations != null && typeAnnotations[i] != null) {
                        firstTypeIndex = i;
                        break;
                    }
                }
                int start = (int) (positions[0] >>> 32);
                int end = (int) positions[firstTypeIndex];

                Type currentType
                    = createBaseType(positions, typeAnnotations, tokens, lenth, firstTypeIndex, isTypeArgumentBased);
                if ((arguments = typeArguments[firstTypeIndex]) != null) {
                    ParameterizedType parameterizedType = new ParameterizedType(this.ast);

                    parameterizedType.setType(currentType);

                    Type type2 = null;
                    for (TypeReference argument : arguments) {
                        type2 = convertType(argument);
                        parameterizedType.typeArguments().add(type2);
                    }
                    end = type2 != null ? type2.getStartPosition() + type2.getLength() - 1 : end;
                    end = retrieveClosingAngleBracketPosition(end + 1);
                    int baseStart = currentType.getStartPosition();
                    start = Math.min(start, baseStart);
                    parameterizedType.setSourceRange(start, end - start + 1);
                    currentType = parameterizedType;
                }

                for (int i = firstTypeIndex + 1; i < lenth; ++i) {
                    SimpleName simpleName = new SimpleName(this.ast);
                    simpleName.setIdentifier(new String(tokens[i]));
                    simpleName.index = i + 1;
                    start = (int) (positions[i] >>> 32);
                    end = (int) positions[i];
                    simpleName.setSourceRange(start, end - start + 1);
                    QualifiedType qualifiedType = new QualifiedType(this.ast);
                    qualifiedType.setQualifier(currentType);
                    qualifiedType.setName(simpleName);
                    start = currentType.getStartPosition();
                    end = simpleName.getStartPosition() + simpleName.getLength() - 1;
                    qualifiedType.setSourceRange(start, end - start + 1);
                    if (typeAnnotations != null && (annotations = typeAnnotations[i]) != null) {
                        int nextPosition = annotateType(qualifiedType, annotations);
                        if (simpleName.getStartPosition() < nextPosition && nextPosition <= end) {
                            simpleName.setSourceRange(nextPosition, end - nextPosition + 1);
                            trimWhiteSpacesAndComments(simpleName);
                        }
                    }

                    currentType = qualifiedType;

                    if ((arguments = typeArguments[i]) != null) {

                        ParameterizedType parameterizedType = new ParameterizedType(this.ast);

                        parameterizedType.setType(currentType);

                        Type type2 = null;
                        for (TypeReference argument : arguments) {
                            type2 = convertType(argument);
                            parameterizedType.typeArguments().add(type2);
                        }
                        end = type2 != null ? type2.getStartPosition() + type2.getLength() - 1 : end;
                        end = retrieveClosingAngleBracketPosition(end + 1);
                        parameterizedType.setSourceRange(start, end - start + 1);
                        currentType = parameterizedType;
                    }
                }
                type = currentType;
            } else if (typeReference instanceof QualifiedTypeReference qualifiedTypeReference) {
                long[] positions = qualifiedTypeReference.sourcePositions;
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] typeAnnotations
                    = typeReference.annotations;
                char[][] tokens = qualifiedTypeReference.tokens;
                int lenth = tokens.length;
                int firstTypeIndex = lenth;

                if (typeAnnotations != null) {
                    for (int i = 0; i < lenth; ++i) {
                        if (typeAnnotations[i] != null) {
                            firstTypeIndex = i;
                            break;
                        }
                    }
                }
                Type currentType = createBaseType(positions, typeAnnotations, tokens, lenth, firstTypeIndex, false);
                for (int i = firstTypeIndex + 1; i < lenth; ++i) {
                    currentType = createQualifiedType(positions, typeAnnotations, tokens, i, currentType);
                }
                type = currentType;
            } else if (typeReference instanceof UnionTypeReference) {
                TypeReference[] typeReferences
                    = ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UnionTypeReference) typeReference).typeReferences;
                // union type reference
                final UnionType unionType = new UnionType(this.ast);
                for (TypeReference ref : typeReferences) {
                    unionType.types().add(this.convertType(ref));
                }
                type = unionType;
                List<Type> types = unionType.types();
                int size = types.size();
                int start = types.get(0).getStartPosition();
                Type lastType = types.get(size - 1);
                int endPosition = lastType.getStartPosition() + lastType.getLength();
                length = endPosition - start; /* + 1 - 1 == 0 */
                type.setSourceRange(start, length);
            } else if (typeReference instanceof IntersectionCastTypeReference) {
                TypeReference[] typeReferences = ((IntersectionCastTypeReference) typeReference).typeReferences;
                // intersection type reference
                final IntersectionType castType = new IntersectionType(this.ast);
                for (TypeReference ref : typeReferences) {
                    castType.types().add(this.convertType(ref));
                }
                type = castType;
                List<Type> types = castType.types();
                int size = types.size();
                int start = types.get(0).getStartPosition();
                Type lastType = types.get(size - 1);
                int endPosition = lastType.getStartPosition() + lastType.getLength();
                length = endPosition - start;
                type.setSourceRange(start, length);
            }

            length = typeReference.sourceEnd - sourceStart + 1;
        }
        if (dimensions != 0) {
            type = convertToArray(type, sourceStart, length, dimensions, typeReference.getAnnotationsOnDimensions());

        }

        return type;
    }

    private Type createBaseType(long[] positions,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] typeAnnotations,
        char[][] tokens, int lenth, int firstTypeIndex, boolean isTypeArgumentBased) {
        Type currentType;
        Name name;
        if (firstTypeIndex == 0) {
            name = createSimpleName(positions, tokens, 0);
            currentType = createSimpleType(name, positions, 0);
            setSourceRangeAnnotationsAndRecordNodes((SimpleType) currentType, positions, typeAnnotations, 0,
                name.index > 0 ? name.index - 1 : 0);
        } else if (firstTypeIndex == lenth) {// Just a QualifiedName
            name = setQualifiedNameNameAndSourceRanges(tokens, positions, firstTypeIndex - 1);
            currentType = createSimpleType(name, positions, firstTypeIndex - 1);
        } else if (isTypeArgumentBased && (typeAnnotations == null || typeAnnotations[firstTypeIndex] == null)) {
            name = setQualifiedNameNameAndSourceRanges(tokens, positions, firstTypeIndex);
            currentType = createSimpleType(name, positions, firstTypeIndex);
        } else {
            if (firstTypeIndex == 1) {
                name = createSimpleName(positions, tokens, 0);
            } else {
                name = setQualifiedNameNameAndSourceRanges(tokens, positions, firstTypeIndex - 1);
            }

            boolean createNameQualifiedType = typeAnnotations != null && typeAnnotations[firstTypeIndex] != null;
            if (createNameQualifiedType) {
                NameQualifiedType nameQualifiedType = new NameQualifiedType(this.ast);
                nameQualifiedType.setQualifier(name);
                nameQualifiedType.setName(createSimpleName(positions, tokens, firstTypeIndex));
                setSourceRangeAnnotationsAndRecordNodes(nameQualifiedType, positions, typeAnnotations, firstTypeIndex,
                    firstTypeIndex);
                currentType = nameQualifiedType;
            } else {
                SimpleType simpleType = this.ast.newSimpleType(name);
                setSourceRangeAnnotationsAndRecordNodes(simpleType, positions, typeAnnotations, 0,
                    name.index > 0 ? name.index - 1 : 0);
                currentType = createQualifiedType(positions, typeAnnotations, tokens, firstTypeIndex, simpleType);
            }
        }
        return currentType;
    }

    private QualifiedType createQualifiedType(long[] positions,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] typeAnnotations,
        char[][] tokens, int index, Type qualifier) {
        SimpleName simpleName = createSimpleName(positions, tokens, index);
        QualifiedType qualifiedType = new QualifiedType(this.ast);
        qualifiedType.setQualifier(qualifier);
        qualifiedType.setName(simpleName);
        int start = qualifier.getStartPosition();
        int end = simpleName.getStartPosition() + simpleName.getLength() - 1;
        setSourceRangeAnnotationsAndRecordNodes(qualifiedType, typeAnnotations, index, start, end);
        return qualifiedType;
    }

    private SimpleType createSimpleType(Name name, long[] positions, int endIndex) {
        SimpleType simpleType = new SimpleType(this.ast);
        simpleType.setName(name);
        int start = (int) (positions[0] >>> 32);
        int end = (int) positions[endIndex];
        simpleType.setSourceRange(start, end - start + 1);

        return simpleType;
    }

    private void setSourceRangeAnnotationsAndRecordNodes(AnnotatableType annotatableType,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] typeAnnotations,
        int index, int start, int end) {
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations;
        int length = end - start + 1;
        annotatableType.setSourceRange(start, length);
        if (typeAnnotations != null && (annotations = typeAnnotations[index]) != null) {
            annotateType(annotatableType, annotations);
        }

    }

    private void setSourceRangeAnnotationsAndRecordNodes(AnnotatableType annotatableType, long[] positions,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[][] typeAnnotations,
        int index, int endIndex) {
        int start = (int) (positions[0] >>> 32);
        int end = (int) positions[endIndex];
        setSourceRangeAnnotationsAndRecordNodes(annotatableType, typeAnnotations, index, start, end);
    }

    private SimpleName createSimpleName(long[] positions, char[][] tokens, int index) {
        final SimpleName simpleName = new SimpleName(this.ast);
        simpleName.internalSetIdentifier(new String(tokens[index]));
        int start = (int) (positions[index] >>> 32);
        int end = (int) positions[index];
        simpleName.setSourceRange(start, end - start + 1);
        simpleName.index = index + 1;

        return simpleName;
    }

    protected Comment createComment(int[] positions) {
        // Create comment node
        Comment comment;
        int start = positions[0];
        int end = positions[1];
        if (positions[1] > 0) { // Javadoc comments have positive end position
            Javadoc docComment = this.docParser.parse(positions);
            if (docComment == null)
                return null;
            comment = docComment;
        } else {
            end = -end;
            if (positions[0] == 0) { // we cannot know without testing chars again
                if (this.docParser.scanner.source[1] == '/') {
                    comment = new LineComment(this.ast);
                } else {
                    comment = new BlockComment(this.ast);
                }
            } else if (positions[0] > 0) { // Block comment have positive start position
                comment = new BlockComment(this.ast);
            } else { // Line comment have negative start and end position
                start = -start;
                comment = new LineComment(this.ast);
            }
            comment.setSourceRange(start, end - start);
        }
        return comment;
    }

    protected Statement createFakeEmptyStatement(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement statement) {
        if (statement == null)
            return null;
        EmptyStatement emptyStatement = new EmptyStatement(this.ast);
        emptyStatement.setFlags(emptyStatement.getFlags() | 1);
        int start = statement.sourceStart;
        int end = statement.sourceEnd;
        emptyStatement.setSourceRange(start, end - start + 1);
        return emptyStatement;
    }

    /**
     * @return a new modifier
     */
    private Modifier createModifier() {
        final Modifier modifier = new Modifier(this.ast);
        int start = this.scanner.getCurrentTokenStartPosition();
        int end = this.scanner.getCurrentTokenEndPosition();
        modifier.setSourceRange(start, end - start + 1);
        return modifier;
    }

    /**
     * @return a new module modifier
     */
    private ModuleModifier createModuleModifier() {
        final ModuleModifier modifier = new ModuleModifier(this.ast);
        int start = this.scanner.getCurrentTokenStartPosition();
        int end = this.scanner.getCurrentTokenEndPosition();
        modifier.setSourceRange(start, end - start + 1);
        return modifier;
    }

    protected InfixExpression.Operator getOperatorFor(int operatorID) {
        return switch (operatorID) {
            case 18 -> InfixExpression.Operator.EQUALS;
            case 5 -> InfixExpression.Operator.LESS_EQUALS;
            case 7 -> InfixExpression.Operator.GREATER_EQUALS;
            case 20 -> InfixExpression.Operator.NOT_EQUALS;
            case 10 -> InfixExpression.Operator.LEFT_SHIFT;
            case 17 -> InfixExpression.Operator.RIGHT_SHIFT_SIGNED;
            case 19 -> InfixExpression.Operator.RIGHT_SHIFT_UNSIGNED;
            case 1 -> InfixExpression.Operator.CONDITIONAL_OR;
            case 0 -> InfixExpression.Operator.CONDITIONAL_AND;
            case 14 -> InfixExpression.Operator.PLUS;
            case 13 -> InfixExpression.Operator.MINUS;
            case 16 -> InfixExpression.Operator.REMAINDER;
            case 8 -> InfixExpression.Operator.XOR;
            case 2 -> InfixExpression.Operator.AND;
            case 15 -> InfixExpression.Operator.TIMES;
            case 3 -> InfixExpression.Operator.OR;
            case 9 -> InfixExpression.Operator.DIVIDE;
            case 6 -> InfixExpression.Operator.GREATER;
            case 4 -> InfixExpression.Operator.LESS;
            case 22, 23, 24, 25 -> throw new IllegalArgumentException(
                "Not an InfixExpression: operatorID=" + operatorID); //$NON-NLS-1$
            default -> throw new IllegalArgumentException("unknown operatorID=" + operatorID); //$NON-NLS-1$
        };
    }

    protected PrimitiveType.Code getPrimitiveTypeCode(char[] name) {
        switch (name[0]) {
            case 'i':
                if (name.length == 3 && name[1] == 'n' && name[2] == 't') {
                    return PrimitiveType.INT;
                }
                break;

            case 'l':
                if (name.length == 4 && name[1] == 'o' && name[2] == 'n' && name[3] == 'g') {
                    return PrimitiveType.LONG;
                }
                break;

            case 'd':
                if (name.length == 6
                    && name[1] == 'o'
                    && name[2] == 'u'
                    && name[3] == 'b'
                    && name[4] == 'l'
                    && name[5] == 'e') {
                    return PrimitiveType.DOUBLE;
                }
                break;

            case 'f':
                if (name.length == 5 && name[1] == 'l' && name[2] == 'o' && name[3] == 'a' && name[4] == 't') {
                    return PrimitiveType.FLOAT;
                }
                break;

            case 'b':
                if (name.length == 4 && name[1] == 'y' && name[2] == 't' && name[3] == 'e') {
                    return PrimitiveType.BYTE;
                } else if (name.length == 7
                    && name[1] == 'o'
                    && name[2] == 'o'
                    && name[3] == 'l'
                    && name[4] == 'e'
                    && name[5] == 'a'
                    && name[6] == 'n') {
                    return PrimitiveType.BOOLEAN;
                }
                break;

            case 'c':
                if (name.length == 4 && name[1] == 'h' && name[2] == 'a' && name[3] == 'r') {
                    return PrimitiveType.CHAR;
                }
                break;

            case 's':
                if (name.length == 5 && name[1] == 'h' && name[2] == 'o' && name[3] == 'r' && name[4] == 't') {
                    return PrimitiveType.SHORT;
                }
                break;

            case 'v':
                if (name.length == 4 && name[1] == 'o' && name[2] == 'i' && name[3] == 'd') {
                    return PrimitiveType.VOID;
                }
        }
        return null; // cannot be reached
    }

    protected boolean isPrimitiveType(char[] name) {
        switch (name[0]) {
            case 'i':
                return name.length == 3 && name[1] == 'n' && name[2] == 't';

            case 'l':
                return name.length == 4 && name[1] == 'o' && name[2] == 'n' && name[3] == 'g';

            case 'd':
                return name.length == 6
                    && name[1] == 'o'
                    && name[2] == 'u'
                    && name[3] == 'b'
                    && name[4] == 'l'
                    && name[5] == 'e';

            case 'f':
                return name.length == 5 && name[1] == 'l' && name[2] == 'o' && name[3] == 'a' && name[4] == 't';

            case 'b':
                if (name.length == 4 && name[1] == 'y' && name[2] == 't' && name[3] == 'e') {
                    return true;
                } else
                    return name.length == 7
                        && name[1] == 'o'
                        && name[2] == 'o'
                        && name[3] == 'l'
                        && name[4] == 'e'
                        && name[5] == 'a'
                        && name[6] == 'n';

            case 'c':
                return name.length == 4 && name[1] == 'h' && name[2] == 'a' && name[3] == 'r';

            case 's':
                return name.length == 5 && name[1] == 'h' && name[2] == 'o' && name[3] == 'r' && name[4] == 't';

            case 'v':
                return name.length == 4 && name[1] == 'o' && name[2] == 'i' && name[3] == 'd';
        }
        return false;
    }

    /**
     * Remove whitespaces and comments before and after the expression.
     */
    private void trimWhiteSpacesAndComments(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression expression) {
        int[] positions = trimWhiteSpacesAndComments(expression.sourceStart, expression.sourceEnd);
        expression.sourceStart = positions[0];
        expression.sourceEnd = positions[1];
    }

    private void trimWhiteSpacesAndComments(ASTNode node) {
        int start = node.getStartPosition();
        int end = start + node.getLength() - 1;
        int[] positions = trimWhiteSpacesAndComments(start, end);
        start = positions[0];
        end = positions[1];
        node.setSourceRange(start, end - start + 1);
    }

    private int[] trimWhiteSpacesAndComments(int start, int end) {
        int[] positions = new int[] { start, end };
        int token;
        int trimLeftPosition = start;
        int trimRightPosition = end;
        boolean first = true;
        Scanner removeBlankScanner = this.ast.scanner;
        try {
            removeBlankScanner.setSource(this.compilationUnitSource);
            removeBlankScanner.resetTo(start, end);
            while (true) {
                token = removeBlankScanner.getNextToken();
                switch (token) {
                    case TokenNameCOMMENT_JAVADOC:
                    case TokenNameCOMMENT_LINE:
                    case TokenNameCOMMENT_BLOCK, TokenNameWHITESPACE:
                        if (first) {
                            trimLeftPosition = removeBlankScanner.currentPosition;
                        }
                        break;

                    case TokenNameEOF:
                        positions[0] = trimLeftPosition;
                        positions[1] = trimRightPosition;
                        return positions;

                    default:
                        /*
                         * if we find something else than a whitespace or a comment, then we reset the trimRigthPosition
                         * to the expression source end.
                         */
                        trimRightPosition = removeBlankScanner.currentPosition - 1;
                        first = false;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return positions;
    }

    /**
     * Remove potential trailing comment by settings the source end on the closing parenthesis
     */
    protected void removeLeadingAndTrailingCommentsFromLiteral(ASTNode node) {
        int start = node.getStartPosition();
        this.scanner.resetTo(start, start + node.getLength());
        int token;
        int startPosition = -1;
        try {
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNameIntegerLiteral:
                    case TokenNameFloatingPointLiteral:
                    case TokenNameLongLiteral:
                    case TokenNameDoubleLiteral:
                    case TokenNameCharacterLiteral:
                        if (startPosition == -1) {
                            startPosition = this.scanner.startPosition;
                        }
                        int end = this.scanner.currentPosition;
                        node.setSourceRange(startPosition, end - startPosition);
                        return;

                    case TokenNameMINUS:
                        startPosition = this.scanner.startPosition;
                        break;

                    default:
                        break;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    /**
     * This method is used to retrieve the end position of the block.
     *
     * @return the dimension found, -1 if none
     */
    protected int retrieveClosingAngleBracketPosition(int start) {
        this.scanner.resetTo(start, this.compilationUnitSourceLength);
        this.scanner.returnOnlyGreater = true;
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNameGREATER:
                        return this.scanner.currentPosition - 1;

                    case TokenNameLESS:
                        // TokenNameLESS can only be found if the current type has a diamond, start is located before
                        // the '<'
                        continue;

                    default:
                        return start;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        this.scanner.returnOnlyGreater = false;
        return start;
    }

    /**
     * This method is used to set the right end position for expression statement. The actual AST nodes don't include
     * the trailing semicolon. This method fixes the length of the corresponding node.
     */
    protected void retrieveColonPosition(ASTNode node) {
        setNodeSourceEndPosition(node);
    }

    private void setNodeSourceEndPosition(ASTNode node) {
        int start = node.getStartPosition();
        int length = node.getLength();
        int end = start + length;
        this.scanner.resetTo(end, this.compilationUnitSourceLength);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNameCOLON) {
                    node.setSourceRange(start, this.scanner.currentPosition - start);
                    return;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    /**
     * This method is used to retrieve the start position of the Ellipsis
     */
    protected int retrieveEllipsisStartPosition(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNameELLIPSIS) {
                    return this.scanner.startPosition - 1;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    protected int retrieveSemiColonPosition(Expression node) {
        int start = node.getStartPosition();
        int length = node.getLength();
        int end = start + length;
        this.scanner.resetTo(end, this.compilationUnitSourceLength);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNameSEMICOLON) {
                    return this.scanner.currentPosition - 1;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    /**
     * This method is used to retrieve the start and end position of a name or primitive type token.
     *
     * @return int[] a single dimensional array, with two elements, for the start and end positions of the name
     * respectively
     */
    protected int[] retrieveEndOfElementTypeNamePosition(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            int count = 0;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNameLPAREN:
                        ++count;
                        break;

                    case TokenNameRPAREN:
                        --count;
                        break;

                    case TokenNameIdentifier:
                    case TokenNamebyte:
                    case TokenNamechar:
                    case TokenNamedouble:
                    case TokenNamefloat:
                    case TokenNameint:
                    case TokenNamelong:
                    case TokenNameshort:
                    case TokenNameboolean:
                        if (count > 0)
                            break;
                        return new int[] { this.scanner.startPosition, this.scanner.currentPosition - 1 };

                    default:
                        break;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return new int[] { -1, -1 };
    }

    /**
     * This method is used to retrieve the position after the right parenthesis.
     *
     * @return int the position found
     */
    protected int retrieveEndOfRightParenthesisPosition(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            int count = 0;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNameRPAREN:
                        count--;
                        if (count <= 0)
                            return this.scanner.currentPosition;
                        break;

                    case TokenNameLPAREN:
                        count++;
                        //$FALL-THROUGH$
                    default:
                        break;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    protected void retrieveDimensionAndSetPositions(int start, int end, Dimension dim) {
        this.scanner.resetTo(start, end);
        int token;
        int count = 0, lParenCount = 0;
        boolean startSet = false;
        try {
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token != TerminalToken.TokenNameWHITESPACE) {
                    if (!startSet) {
                        start = this.scanner.startPosition;
                        startSet = true;
                    }
                    switch (token) {
                        case TokenNameRBRACKET:
                            if (lParenCount > 0)
                                break;
                            --count;
                            if (count > 0)
                                break;
                            int endDim = this.scanner.currentPosition - 1;
                            dim.setSourceRange(start, endDim - start + 1);
                            return;

                        case TokenNameLBRACKET:
                            if (lParenCount > 0)
                                break;
                            count++;
                            break;

                        case TokenNameLPAREN:
                            lParenCount++;
                            break;

                        case TokenNameRPAREN:
                            --lParenCount;
                            break;

                        default:
                            break;
                    }
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    protected void retrieveIdentifierAndSetPositions(int start, int end, Name name) {
        this.scanner.resetTo(start, end);
        int token;
        try {
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNameIdentifier) {
                    int startName = this.scanner.startPosition;
                    int endName = this.scanner.currentPosition - 1;
                    name.setSourceRange(startName, endName - startName + 1);
                    return;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    /**
     * This method is used to retrieve the start position of the block.
     *
     * @return int the dimension found, -1 if none
     */
    protected int retrieveIdentifierEndPosition(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNameIdentifier) {// 110
                    return this.scanner.getCurrentTokenEndPosition();
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    /**
     * retrieves the start and and of new and set the positions of the name
     *
     * @param start position to start search
     * @param end position to end search
     * @param name object where these positions will be updated.
     */
    protected void retrieveInitAndSetPositions(int start, int end, Name name) {
        this.scanner.resetTo(start, end);
        int token;
        try {
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNamenew) {
                    int startName = this.scanner.startPosition;
                    int endName = this.scanner.currentPosition;
                    name.setSourceRange(startName, endName - startName);
                    return;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    /**
     * This method is used to retrieve position before the next comma or semi-colon.
     *
     * @param initializerEnd the given initializer end exclusive
     * @return int the position found.
     */
    protected int retrieveEndOfPotentialExtendedDimensions(int initializerEnd, int nameEnd, int end) {
        this.scanner.resetTo(initializerEnd, end);
        boolean hasTokens = false;
        int balance = 0;
        int pos = initializerEnd > nameEnd ? initializerEnd - 1 : nameEnd;
        try {
            int token;
            int lParenCount = 0;
            boolean hasAnnotations = false;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                hasTokens = true;
                if (hasAnnotations) {
                    if (token == TerminalToken.TokenNameLPAREN)
                        ++lParenCount;
                    else if (token == TerminalToken.TokenNameRPAREN) {
                        --lParenCount;
                        continue;
                    }
                    if (lParenCount > 0)
                        continue;
                }
                switch (token) {
                    case TokenNameAT:
                        hasAnnotations = true;
                        break;

                    case TokenNameLBRACE:
                    case TokenNameLBRACKET:
                        balance++;
                        break;

                    case TokenNameRBRACKET:
                    case TokenNameRBRACE:
                        balance--;
                        pos = this.scanner.currentPosition - 1;
                        break;

                    case TokenNameCOMMA:
                        if (balance == 0)
                            return pos;
                        // case where a missing closing brace doesn't close an array initializer
                        pos = this.scanner.currentPosition - 1;
                        break;

                    case TokenNameSEMICOLON:
                        if (balance == 0)
                            return pos;
                        return -pos;

                    default:
                        break;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        // no token, we simply return pos as the right position
        return hasTokens ? Integer.MIN_VALUE : pos;
    }

    protected int retrieveProperRightBracketPosition(int bracketNumber, int start) {
        this.scanner.resetTo(start, this.compilationUnitSourceLength);
        try {
            int token;
            int count = 0, lParentCount = 0, balance = 0;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNameLPAREN:
                        ++lParentCount;
                        break;

                    case TokenNameRPAREN:
                        --lParentCount;
                        break;

                    case TokenNameLBRACKET:
                        ++balance;
                        break;

                    case TokenNameELLIPSIS:
                        ++balance; // special case for varargs - simulate lbracket found
                        //$FALL-THROUGH$
                    case TokenNameRBRACKET:
                        --balance;
                        if (lParentCount > 0)
                            break;
                        if (balance > 0)
                            break;
                        count++;
                        if (count == bracketNumber) {
                            return this.scanner.currentPosition - 1;
                        }
                        break;

                    default:
                        break;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    /**
     * This method is used to retrieve position before the next right brace or semi-colon.
     *
     * @return int the position found.
     */
    protected int retrieveRightBraceOrSemiColonPosition(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                switch (token) {
                    case TokenNameRBRACE, TokenNameSEMICOLON:
                        return this.scanner.currentPosition - 1;

                    default:
                        break;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    /**
     * This method is used to retrieve position before the next right brace or semi-colon.
     *
     * @return int the position found.
     */
    protected int retrieveRightBrace(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNameRBRACE) {
                    return this.scanner.currentPosition - 1;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    /**
     * This method is used to retrieve the start position of the block.
     *
     * @return int the dimension found, -1 if none
     */
    protected int retrieveStartBlockPosition(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNameLBRACE) {// 110
                    return this.scanner.startPosition;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    /**
     * This method is used to retrieve the starting position of the catch keyword.
     *
     * @return int the dimension found, -1 if none
     */
    protected int retrieveStartingCatchPosition(int start, int end) {
        this.scanner.resetTo(start, end);
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                if (token == TerminalToken.TokenNamecatch) {// 225
                    return this.scanner.startPosition;
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
        return -1;
    }

    public void setAST(AST ast) {
        this.ast = ast;
        this.docParser = new DocCommentParser(this.ast, this.scanner);
    }

    protected void setModifiers(AnnotationTypeDeclaration typeDecl,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration typeDeclaration) {
        this.scanner.resetTo(typeDeclaration.declarationSourceStart, typeDeclaration.sourceStart);
        this.setModifiers(typeDecl, typeDeclaration.annotations, typeDeclaration.sourceStart);
    }

    protected void setModifiers(AnnotationTypeMemberDeclaration annotationTypeMemberDecl,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AnnotationMethodDeclaration annotationTypeMemberDeclaration) {
        this.scanner.resetTo(annotationTypeMemberDeclaration.declarationSourceStart,
            annotationTypeMemberDeclaration.sourceStart);
        this.setModifiers(annotationTypeMemberDecl, annotationTypeMemberDeclaration.annotations,
            annotationTypeMemberDeclaration.sourceStart);
    }

    protected void setModifiers(BodyDeclaration bodyDeclaration,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations,
        int modifiersEnd) {
        setModifiers(bodyDeclaration.modifiers(), annotations, modifiersEnd);
    }

    protected void setModifiers(List<IExtendedModifier> modifiers,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations,
        int modifiersEnd) {
        this.scanner.tokenizeWhiteSpace = false;
        try {
            int token;
            int indexInAnnotations = 0;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                IExtendedModifier modifier = null;
                switch (token) {
                    case TokenNameabstract, TokenNamepublic, TokenNamestatic, TokenNameprotected, TokenNameprivate, TokenNamefinal, TokenNamenative, TokenNamesynchronized, TokenNametransient, TokenNamevolatile, TokenNamestrictfp, TokenNamedefault:
                        modifier = createModifier();
                        break;

                    case TokenNameAT:
                        // we have an annotation
                        if (annotations != null && indexInAnnotations < annotations.length) {
                            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation annotation
                                = annotations[indexInAnnotations++];
                            modifier = convert(annotation);
                            this.scanner.resetTo(annotation.declarationSourceEnd + 1, modifiersEnd);
                        }
                        break;

                    default:
                        // comments, or tokens of a syntax error
                        break;
                }
                if (modifier != null) {
                    modifiers.add(modifier);
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    protected void setModifiers(EnumDeclaration enumDeclaration,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration enumDeclaration2) {
        this.scanner.resetTo(enumDeclaration2.declarationSourceStart, enumDeclaration2.sourceStart);
        this.setModifiers(enumDeclaration, enumDeclaration2.annotations, enumDeclaration2.sourceStart);
    }

    protected void setModifiers(EnumConstantDeclaration enumConstantDeclaration,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration fieldDeclaration) {
        this.scanner.resetTo(fieldDeclaration.declarationSourceStart, fieldDeclaration.sourceStart);
        this.setModifiers(enumConstantDeclaration, fieldDeclaration.annotations, fieldDeclaration.sourceStart);
    }

    protected void setModifiers(FieldDeclaration fieldDeclaration,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration fieldDecl) {
        this.scanner.resetTo(fieldDecl.declarationSourceStart, fieldDecl.sourceStart);
        this.setModifiers(fieldDeclaration, fieldDecl.annotations, fieldDecl.sourceStart);
    }

    protected void setModifiers(Initializer initializer,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Initializer oldInitializer) {
        this.scanner.resetTo(oldInitializer.declarationSourceStart, oldInitializer.bodyStart);
        this.setModifiers(initializer, oldInitializer.annotations, oldInitializer.bodyStart);
    }

    protected void setModifiers(MethodDeclaration methodDecl, AbstractMethodDeclaration methodDeclaration) {
        this.scanner.resetTo(methodDeclaration.declarationSourceStart, methodDeclaration.sourceStart);
        this.setModifiers(methodDecl, methodDeclaration.annotations, methodDeclaration.sourceStart);
    }

    protected void setAnnotations(ModuleDeclaration moduleDecl,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ModuleDeclaration moduleDeclaration) {
        this.scanner.resetTo(moduleDeclaration.declarationSourceStart, moduleDeclaration.sourceStart);
        List<IExtendedModifier> modifiers = new ArrayList<>();
        this.setModifiers(modifiers, moduleDeclaration.annotations, moduleDeclaration.sourceStart);
        for (IExtendedModifier ie : modifiers) {
            if (!ie.isAnnotation()) {
                continue; // not setting to malformed.
            }
            moduleDecl.annotations().add((Annotation) ie);
        }
    }

    protected void setModifiers(List<IExtendedModifier> modifiers, LocalDeclaration localDeclaration) {
        this.scanner.resetTo(localDeclaration.declarationSourceStart, localDeclaration.sourceStart);
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation[] annotations
            = localDeclaration.annotations;
        int indexInAnnotations = 0;
        try {
            int token;
            while ((token = this.scanner.getNextToken()) != TerminalToken.TokenNameEOF) {
                IExtendedModifier modifier = null;
                switch (token) {
                    case TokenNameabstract, TokenNamepublic, TokenNamestatic, TokenNameprotected, TokenNameprivate, TokenNamefinal, TokenNamenative, TokenNamesynchronized, TokenNametransient, TokenNamevolatile, TokenNamestrictfp:
                        modifier = createModifier();
                        break;

                    case TokenNameAT:
                        // we have an annotation
                        if (annotations != null && indexInAnnotations < annotations.length) {
                            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation annotation
                                = annotations[indexInAnnotations++];
                            modifier = convert(annotation);
                            this.scanner.resetTo(annotation.declarationSourceEnd + 1, this.compilationUnitSourceLength);
                        }
                        break;

                    case TokenNameCOMMENT_BLOCK:
                    case TokenNameCOMMENT_LINE:
                    case TokenNameCOMMENT_JAVADOC:
                        break;

                    default:
                        return;
                }
                if (modifier != null) {
                    modifiers.add(modifier);
                }
            }
        } catch (InvalidInputException e) {
            // ignore
        }
    }

    protected void setModifiers(TypeDeclaration typeDecl,
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration typeDeclaration) {
        this.scanner.resetTo(typeDeclaration.declarationSourceStart, typeDeclaration.sourceStart);
        this.setModifiers(typeDecl, typeDeclaration.annotations, typeDeclaration.sourceStart);
    }

    protected QualifiedName setQualifiedNameNameAndSourceRanges(char[][] typeName, long[] positions) {
        int length = typeName.length;
        final SimpleName firstToken = new SimpleName(this.ast);
        firstToken.internalSetIdentifier(new String(typeName[0]));
        firstToken.index = 1;
        int start0 = (int) (positions[0] >>> 32);
        int start = start0;
        int end = (int) (positions[0]);
        firstToken.setSourceRange(start, end - start + 1);
        final SimpleName secondToken = new SimpleName(this.ast);
        secondToken.internalSetIdentifier(new String(typeName[1]));
        secondToken.index = 2;
        start = (int) (positions[1] >>> 32);
        end = (int) (positions[1]);
        secondToken.setSourceRange(start, end - start + 1);
        QualifiedName qualifiedName = new QualifiedName(this.ast);
        qualifiedName.setQualifier(firstToken);
        qualifiedName.setName(secondToken);

        qualifiedName.index = 2;
        qualifiedName.setSourceRange(start0, end - start0 + 1);
        SimpleName newPart;
        for (int i = 2; i < length; i++) {
            newPart = new SimpleName(this.ast);
            newPart.internalSetIdentifier(new String(typeName[i]));
            newPart.index = i + 1;
            start = (int) (positions[i] >>> 32);
            end = (int) (positions[i]);
            newPart.setSourceRange(start, end - start + 1);
            QualifiedName qualifiedName2 = new QualifiedName(this.ast);
            qualifiedName2.setQualifier(qualifiedName);
            qualifiedName2.setName(newPart);
            qualifiedName = qualifiedName2;
            qualifiedName.index = newPart.index;
            qualifiedName.setSourceRange(start0, end - start0 + 1);

        }

        return qualifiedName;
    }

    protected QualifiedName setQualifiedNameNameAndSourceRanges(char[][] typeName, long[] positions, int endingIndex) {
        int length = endingIndex + 1;
        final SimpleName firstToken = new SimpleName(this.ast);
        firstToken.internalSetIdentifier(new String(typeName[0]));
        firstToken.index = 1;
        int start0 = (int) (positions[0] >>> 32);
        int start = start0;
        int end = (int) positions[0];
        firstToken.setSourceRange(start, end - start + 1);
        final SimpleName secondToken = new SimpleName(this.ast);
        secondToken.internalSetIdentifier(new String(typeName[1]));
        secondToken.index = 2;
        start = (int) (positions[1] >>> 32);
        end = (int) positions[1];
        secondToken.setSourceRange(start, end - start + 1);
        QualifiedName qualifiedName = new QualifiedName(this.ast);
        qualifiedName.setQualifier(firstToken);
        qualifiedName.setName(secondToken);

        qualifiedName.index = 2;
        qualifiedName.setSourceRange(start0, end - start0 + 1);
        SimpleName newPart;
        for (int i = 2; i < length; i++) {
            newPart = new SimpleName(this.ast);
            newPart.internalSetIdentifier(new String(typeName[i]));
            newPart.index = i + 1;
            start = (int) (positions[i] >>> 32);
            end = (int) positions[i];
            newPart.setSourceRange(start, end - start + 1);
            QualifiedName qualifiedName2 = new QualifiedName(this.ast);
            qualifiedName2.setQualifier(qualifiedName);
            qualifiedName2.setName(newPart);
            qualifiedName = qualifiedName2;
            qualifiedName.index = newPart.index;
            qualifiedName.setSourceRange(start0, end - start0 + 1);

        }
        return qualifiedName;
    }

    protected void setTypeNameForAnnotation(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation compilerAnnotation,
        Annotation annotation) {
        TypeReference typeReference = compilerAnnotation.type;
        if (typeReference instanceof QualifiedTypeReference qualifiedTypeReference) {
            char[][] tokens = qualifiedTypeReference.tokens;
            long[] positions = qualifiedTypeReference.sourcePositions;
            // QualifiedName
            annotation.setTypeName(setQualifiedNameNameAndSourceRanges(tokens, positions));
        } else {
            SingleTypeReference singleTypeReference = (SingleTypeReference) typeReference;
            final SimpleName name = new SimpleName(this.ast);
            name.internalSetIdentifier(new String(singleTypeReference.token));
            int start = singleTypeReference.sourceStart;
            int end = singleTypeReference.sourceEnd;
            name.setSourceRange(start, end - start + 1);
            name.index = 1;
            annotation.setTypeName(name);

        }
    }

    protected void setTypeForField(FieldDeclaration fieldDeclaration, Type type, int extraDimension) {
        if (extraDimension != 0) {
            if (type.isArrayType()) {
                ArrayType arrayType = (ArrayType) type;
                int remainingDimensions = arrayType.getDimensions() - extraDimension;
                if (remainingDimensions == 0) {
                    // the dimensions are after the name so the type of the fieldDeclaration is a simpleType
                    Type elementType = arrayType.getElementType();
                    // cut the child loose from its parent (without creating garbage)
                    elementType.setParent(null, null);

                    fieldDeclaration.setType(elementType);
                } else {
                    ArrayType subarrayType = extractSubArrayType(arrayType, remainingDimensions, extraDimension);
                    fieldDeclaration.setType(subarrayType);

                }
                checkAndSetMalformed(type, fieldDeclaration);
            } else {
                fieldDeclaration.setType(type);
            }
        } else {
            fieldDeclaration.setType(type);
        }
    }

    /**
     * extracts the subArrayType for a given declaration for AST levels less
     *
     * @param arrayType parent type
     * @return an ArrayType
     */
    private ArrayType extractSubArrayType(ArrayType arrayType, int remainingDimensions, int dimensionsToRemove) {
        int start = arrayType.getStartPosition();
        List<Dimension> dimensions = arrayType.dimensions();
        while (dimensionsToRemove > 0) {
            dimensions.remove(dimensions.size() - 1);
            dimensionsToRemove--;
        }
        int end = retrieveProperRightBracketPosition(remainingDimensions, start);
        arrayType.setSourceRange(start, end - start + 1);
        // cut the child loose from its parent (without creating garbage)
        arrayType.setParent(null, null);
        return arrayType;
    }

    protected void setTypeForMethodDeclaration(MethodDeclaration methodDeclaration, Type type, int extraDimension) {
        if (extraDimension != 0) {
            if (type.isArrayType()) {
                ArrayType arrayType = (ArrayType) type;
                int remainingDimensions = arrayType.getDimensions() - extraDimension;
                if (remainingDimensions == 0) {
                    // the dimensions are after the name so the type of the fieldDeclaration is a simpleType
                    Type elementType = arrayType.getElementType();
                    // cut the child loose from its parent (without creating garbage)
                    elementType.setParent(null, null);

                    methodDeclaration.setReturnType2(elementType);
                } else {
                    ArrayType subarrayType = extractSubArrayType(arrayType, remainingDimensions, extraDimension);
                    methodDeclaration.setReturnType2(subarrayType);

                }
                checkAndSetMalformed(type, methodDeclaration);
            } else {
                methodDeclaration.setReturnType2(type);
            }
        } else {
            methodDeclaration.setReturnType2(type);
        }
    }

    protected void setTypeForMethodDeclaration(AnnotationTypeMemberDeclaration annotationTypeMemberDeclaration,
        Type type) {
        annotationTypeMemberDeclaration.setType(type);
    }

    protected void setTypeForSingleVariableDeclaration(SingleVariableDeclaration singleVariableDeclaration, Type type,
        int extraDimension) {
        if (extraDimension != 0) {
            if (type.isArrayType()) {
                ArrayType arrayType = (ArrayType) type;
                int remainingDimensions = arrayType.getDimensions() - extraDimension;
                if (remainingDimensions == 0) {
                    // the dimensions are after the name so the type of the fieldDeclaration is a simpleType
                    Type elementType = arrayType.getElementType();
                    // cut the child loose from its parent (without creating garbage)
                    elementType.setParent(null, null);

                    singleVariableDeclaration.setType(elementType);
                } else {
                    ArrayType subarrayType = extractSubArrayType(arrayType, remainingDimensions, extraDimension);

                    singleVariableDeclaration.setType(subarrayType);
                }
                checkAndSetMalformed(type, singleVariableDeclaration);
            } else {
                singleVariableDeclaration.setType(type);
            }
        } else {
            singleVariableDeclaration.setType(type);
        }
    }

    protected void setTypeForVariableDeclarationExpression(VariableDeclarationExpression variableDeclarationExpression,
        Type type, int extraDimension) {
        if (extraDimension != 0) {
            if (type.isArrayType()) {
                ArrayType arrayType = (ArrayType) type;
                int remainingDimensions = arrayType.getDimensions() - extraDimension;
                if (remainingDimensions == 0) {
                    // the dimensions are after the name so the type of the fieldDeclaration is a simpleType
                    Type elementType = arrayType.getElementType();
                    // cut the child loose from its parent (without creating garbage)
                    elementType.setParent(null, null);

                    variableDeclarationExpression.setType(elementType);
                } else {
                    ArrayType subarrayType = extractSubArrayType(arrayType, remainingDimensions, extraDimension);
                    variableDeclarationExpression.setType(subarrayType);

                }
                checkAndSetMalformed(type, variableDeclarationExpression);
            } else {
                variableDeclarationExpression.setType(type);
            }
        } else {
            variableDeclarationExpression.setType(type);
        }
    }

    protected void setTypeForVariableDeclarationStatement(VariableDeclarationStatement variableDeclarationStatement,
        Type type, int extraDimension) {
        if (extraDimension != 0) {
            if (type.isArrayType()) {
                ArrayType arrayType = (ArrayType) type;
                int remainingDimensions = arrayType.getDimensions() - extraDimension;
                if (remainingDimensions == 0) {
                    // the dimensions are after the name so the type of the fieldDeclaration is a simpleType
                    Type elementType = arrayType.getElementType();
                    // cut the child loose from its parent (without creating garbage)
                    elementType.setParent(null, null);

                    variableDeclarationStatement.setType(elementType);
                } else {
                    ArrayType subarrayType = extractSubArrayType(arrayType, remainingDimensions, extraDimension);
                    variableDeclarationStatement.setType(subarrayType);

                }
                checkAndSetMalformed(type, variableDeclarationStatement);
            } else {
                variableDeclarationStatement.setType(type);
            }
        } else {
            variableDeclarationStatement.setType(type);
        }
    }

}
