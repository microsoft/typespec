// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.ImmutableMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ResourceImplementation {

    private final List<ImmutableMethod> methods = new ArrayList<>();
    private final List<LocalVariable> localVariables = new ArrayList<>();

    public ResourceImplementation(FluentResourceModel fluentModel) {
        List<FluentMethod> fluentMethods = new ArrayList<>();
        List<LocalVariable> localVariables = new ArrayList<>();
        if (fluentModel.getResourceCreate() != null) {
            fluentMethods.addAll(fluentModel.getResourceCreate().getFluentMethods());
            localVariables.addAll(fluentModel.getResourceCreate().getLocalVariables());
        }
        if (fluentModel.getResourceUpdate() != null) {
            fluentMethods.addAll(fluentModel.getResourceUpdate().getFluentMethods());
            localVariables.addAll(fluentModel.getResourceUpdate().getLocalVariables());
        }
        if (fluentModel.getResourceRefresh() != null) {
            fluentMethods.addAll(fluentModel.getResourceRefresh().getFluentMethods());
            //localVariables.addAll(fluentModel.getResourceRefresh().getLocalVariables());
        }
        if (fluentModel.getResourceActions() != null) {
            fluentMethods.addAll(fluentModel.getResourceActions().getFluentMethods());
        }
        this.groupMethods(fluentMethods);
        this.groupLocalVariables(localVariables);
    }

    private void groupLocalVariables(Collection<LocalVariable> localVariables) {
        Map<String, LocalVariable> localVariablesMap = new LinkedHashMap<>();
        localVariables.forEach(var -> localVariablesMap.putIfAbsent(var.getName(), var));
        this.localVariables.addAll(localVariablesMap.values());
    }

    private void groupMethods(Collection<FluentMethod> fluentMethods) {
        Map<String, GroupedMethod> groupedMethodsMap = new LinkedHashMap<>();
        for (FluentMethod method : fluentMethods) {
            if (method.getType() == FluentMethodType.CREATE_WITH || method.getType() == FluentMethodType.UPDATE_WITH) {
                GroupedMethod groupedMethod = groupedMethodsMap.computeIfAbsent(method.getImplementationMethodSignature(), key -> new GroupedMethod());
                if (method.getType() == FluentMethodType.CREATE_WITH) {
                    groupedMethod.methodCreateWith = method;
                } else {
                    groupedMethod.methodUpdateWith = method;
                }
            } else {
                this.methods.add(method);
            }
        }

        boolean branchMethodNeeded = false;

        for (GroupedMethod groupedMethod : groupedMethodsMap.values()) {
            if (groupedMethod.size() == 1) {
                this.methods.add(groupedMethod.single());
            } else {
                MergedFluentMethod method = new MergedFluentMethod(groupedMethod);
                this.methods.add(method);

                branchMethodNeeded = branchMethodNeeded || method.isBranchMethodNeeded();
            }
        }

        if (branchMethodNeeded) {
            this.methods.add(new FluentMethodCreateMode());
        }
    }

    public List<ImmutableMethod> getMethods() {
        return this.methods;
    }

    public List<LocalVariable> getLocalVariables() {
        return this.localVariables;
    }

    private static class MergedFluentMethod implements ImmutableMethod {

        private final MethodTemplate implementationMethodTemplate;
        private final boolean branchMethodNeeded;

        public MergedFluentMethod(GroupedMethod groupedMethod) {
            if (groupedMethod.methodCreateWith.equals(groupedMethod.methodUpdateWith)) {
                this.implementationMethodTemplate = groupedMethod.methodCreateWith.getMethodTemplate();
                branchMethodNeeded = false;
            } else {
                this.implementationMethodTemplate = MethodTemplate.builder()
                        .methodSignature(groupedMethod.methodCreateWith.getImplementationMethodSignature())
                        .method(block -> {
                            block.ifBlock("isInCreateMode()", ifBlock -> {
                                groupedMethod.methodCreateWith.getMethodTemplate().writeMethodContent(ifBlock);
                            }).elseBlock(elseBlock -> {
                                groupedMethod.methodUpdateWith.getMethodTemplate().writeMethodContent(elseBlock);
                            });
                        })
                        .build();
                branchMethodNeeded = true;
            }
        }

        public boolean isBranchMethodNeeded() {
            return branchMethodNeeded;
        }

        @Override
        public MethodTemplate getMethodTemplate() {
            return implementationMethodTemplate;
        }
    }

    private static class FluentMethodCreateMode implements ImmutableMethod {

        private final MethodTemplate implementationMethodTemplate;

        public FluentMethodCreateMode() {
            this.implementationMethodTemplate = MethodTemplate.builder()
                    .visibility(JavaVisibility.Private)
                    .methodSignature("boolean isInCreateMode()")
                    .method(block -> {
                        block.methodReturn(String.format("this.%1$s().id() == null", ModelNaming.METHOD_INNER_MODEL));
                    })
                    .build();
        }

        @Override
        public MethodTemplate getMethodTemplate() {
            return implementationMethodTemplate;
        }
    }

    private static class GroupedMethod {
        private FluentMethod methodCreateWith;
        private FluentMethod methodUpdateWith;

        private int size() {
            return (methodCreateWith == null ? 0 : 1) + (methodUpdateWith == null ? 0 : 1);
        }

        private FluentMethod single() {
            return methodUpdateWith == null ? methodCreateWith : methodUpdateWith;
        }
    }
}
