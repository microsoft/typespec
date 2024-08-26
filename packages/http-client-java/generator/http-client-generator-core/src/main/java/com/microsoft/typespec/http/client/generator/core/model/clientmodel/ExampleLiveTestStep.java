// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public class ExampleLiveTestStep extends LiveTestStep{

    private String operationId;
    private ProxyMethodExample example;

    public static ExampleLiveTestStep.Builder newBuilder(){
        return new ExampleLiveTestStep.Builder();
    }

    public static class Builder extends LiveTestStep.Builder<ExampleLiveTestStep, Builder>{

        private Builder(){
            super(new ExampleLiveTestStep());
        }

        public Builder operationId(String operationId) {
            step.operationId = operationId;
            return this;
        }

        public Builder example(ProxyMethodExample example) {
            step.example = example;
            return this;
        }

        @Override
        protected Builder getThis() {
            return this;
        }
    }

    public String getOperationId() {
        return operationId;
    }

    public ProxyMethodExample getExample() {
        return example;
    }

    public String getDescription() {
        return description;
    }
}
