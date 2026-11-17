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
 *     Christoph Läubrich -  Enhance the BuildContext with the discovered annotations #674
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * A compilation result consists of all information returned by the compiler for a single compiled compilation source
 * unit. This includes: <ul> <li> the compilation unit that was compiled <li> for each type produced by compiling the
 * compilation unit, its binary and optionally its principal structure <li> any problems (errors or warnings) produced
 * <li> dependency info </ul>
 *
 * The principle structure and binary may be null if the compiler could not produce them. If neither could be produced,
 * there is no corresponding entry for the type.
 *
 * The dependency info includes type references such as supertypes, field types, method parameter and return types,
 * local variable types, types of intermediate expressions, etc. It also includes the namespaces (packages) in which
 * names were looked up. It does <em>not</em> include finer grained dependencies such as information about specific
 * fields and methods which were referenced, but does contain their declaring types and any other types used to locate
 * such fields or methods.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class CompilationResult {

    public IProblem[] problems;
    public IProblem[] tasks;
    public int problemCount;
    public int taskCount;
    public BasicCompilationUnit compilationUnit;
    private Map<IProblem, ReferenceContext> problemsMap;
    private Set firstErrors;

    public int[] lineSeparatorPositions;

    public char[] fileName;
    public boolean hasSyntaxError = false;

    private static final Comparator PROBLEM_COMPARATOR = Comparator.comparingInt(o -> ((IProblem) o).getSourceStart());

    public CompilationResult(BasicCompilationUnit compilationUnit) {
        this.fileName = compilationUnit.getFileName();
        this.compilationUnit = compilationUnit;

    }

    private int computePriority(IProblem problem) {

        int priority = 10000 - problem.getSourceLineNumber(); // early problems first
        if (priority < 0)
            priority = 0;
        if (problem.isError()) {
            priority += 100000;
        }
        ReferenceContext context = this.problemsMap == null ? null : this.problemsMap.get(problem);
        if (context != null) {
            if (context instanceof AbstractMethodDeclaration method) {
                if (method.isStatic()) {
                    priority += 10000;
                }
            } else {
                priority += 40000;
            }
            if (this.firstErrors.contains(problem)) { // if context is null, firstErrors is null too
                priority += 20000;
            }
        } else {
            priority += 40000;
        }
        return priority;
    }

    /**
     * Answer the initial file name
     */
    public char[] getFileName() {
        return this.fileName;
    }

    public int[] getLineSeparatorPositions() {
        return this.lineSeparatorPositions == null ? Util.EMPTY_INT_ARRAY : this.lineSeparatorPositions;
    }

    /**
     * Same as getProblems() but don't answer problems that actually concern the enclosing package.
     */
    public IProblem[] getCUProblems() {
        // Re-adjust the size of the problems if necessary and filter package problems
        if (this.problems != null) {
            IProblem[] filteredProblems = new IProblem[this.problemCount];
            int keep = 0;
            for (int i = 0; i < this.problemCount; i++) {
                IProblem problem = this.problems[i];
                if (problem.getID() != 536871825) {
                    filteredProblems[keep++] = problem;
                } else if (this.compilationUnit != null) {
                    if (CharOperation.equals(this.compilationUnit.getMainTypeName(), TypeConstants.PACKAGE_INFO_NAME)) {
                        filteredProblems[keep++] = problem;
                    }
                }
            }
            if (keep < this.problemCount) {
                System.arraycopy(filteredProblems, 0, filteredProblems = new IProblem[keep], 0, keep);
                this.problemCount = keep;
            }
            this.problems = filteredProblems;
            if (this.problemCount > 100) {
                quickPrioritize(this.problems, 0, this.problemCount - 1);
                this.problemCount = 100;
                System.arraycopy(this.problems, 0, (this.problems = new IProblem[this.problemCount]), 0,
                    this.problemCount);
            }

            // Stable sort problems per source positions.
            Arrays.sort(this.problems, 0, this.problems.length, CompilationResult.PROBLEM_COMPARATOR);
        }
        return this.problems;
    }

    private void quickPrioritize(IProblem[] problemList, int left, int right) {
        if (left >= right)
            return;
        // sort the problems by their priority... starting with the highest priority
        int original_left = left;
        int original_right = right;
        int mid = computePriority(problemList[left + (right - left) / 2]);
        do {
            while (computePriority(problemList[right]) < mid)
                right--;
            while (mid < computePriority(problemList[left]))
                left++;
            if (left <= right) {
                IProblem tmp = problemList[left];
                problemList[left] = problemList[right];
                problemList[right] = tmp;
                left++;
                right--;
            }
        } while (left <= right);
        if (original_left < right)
            quickPrioritize(problemList, original_left, right);
        if (left < original_right)
            quickPrioritize(problemList, left, original_right);
    }

    public void record(IProblem newProblem, ReferenceContext referenceContext) {
        if (newProblem.getID() == 536871362) {
            recordTask(newProblem);
            return;
        }
        if (this.problemCount == 0) {
            this.problems = new IProblem[5];
        } else if (this.problemCount == this.problems.length) {
            System.arraycopy(this.problems, 0, (this.problems = new IProblem[this.problemCount * 2]), 0,
                this.problemCount);
        }
        this.problems[this.problemCount++] = newProblem;
        if (referenceContext != null) {
            if (this.problemsMap == null)
                this.problemsMap = new HashMap(5);
            if (this.firstErrors == null)
                this.firstErrors = new HashSet(5);
            if (newProblem.isError() && !referenceContext.hasErrors())
                this.firstErrors.add(newProblem);
            this.problemsMap.put(newProblem, referenceContext);
        }
        if (newProblem.isError()) {
            if ((newProblem.getID() & 1073741824) != 0) {
                this.hasSyntaxError = true;
            }
        }
    }

    private void recordTask(IProblem newProblem) {
        if (this.taskCount == 0) {
            this.tasks = new IProblem[5];
        } else if (this.taskCount == this.tasks.length) {
            System.arraycopy(this.tasks, 0, (this.tasks = new IProblem[this.taskCount * 2]), 0, this.taskCount);
        }
        this.tasks[this.taskCount++] = newProblem;
    }

}
