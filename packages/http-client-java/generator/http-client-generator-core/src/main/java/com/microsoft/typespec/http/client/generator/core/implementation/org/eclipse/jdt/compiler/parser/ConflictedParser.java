// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

public interface ConflictedParser {

    /*
     * Return true if at the configuration the parser finds itself in, token would need to be disambiguated. At Java SE
     * 8 time, we have three tokens that need to clarified: the use of '( and that of '<' and finally whether an @
     * begins a SE8 style type annotation or a SE5 declaration annotation. Where they can co-exist, we treat the type
     * annotation as a declarative annotation.
     */
    boolean atConflictScenario(TerminalToken token);

    /*
     * Return true if at the configuration the parser finds itself in, it would shift the token. It is axiomatic of the
     * push down automaton that corresponds to the LALR grammar that it will never shift on invalid input.
     */
    boolean automatonWillShift(TerminalToken token);

    /*
     * Return true if the parser is parsing a module declaration. In Java 9, module, requires, exports, to, uses,
     * provides, and with are restricted keywords (i.e. they are keywords solely where they appear as terminals in
     * ModuleDeclaration, and are identifiers everywhere else)
     */
    boolean isParsingModuleDeclaration();
}
