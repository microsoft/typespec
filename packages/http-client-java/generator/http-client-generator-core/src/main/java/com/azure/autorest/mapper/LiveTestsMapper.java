// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.mapper;

import com.azure.autorest.extension.base.model.codemodel.ScenarioStep;
import com.azure.autorest.extension.base.model.codemodel.TestModel;
import com.azure.autorest.extension.base.model.codemodel.TestScenarioStepType;
import com.azure.autorest.model.clientmodel.ExampleLiveTestStep;
import com.azure.autorest.model.clientmodel.LiveTestCase;
import com.azure.autorest.model.clientmodel.LiveTestStep;
import com.azure.autorest.model.clientmodel.LiveTests;
import com.azure.autorest.model.clientmodel.ProxyMethodExample;
import com.azure.autorest.util.CodeNamer;
import com.azure.autorest.util.XmsExampleWrapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * A mapper to map test model to live tests.
 */
public class LiveTestsMapper implements IMapper<TestModel, List<LiveTests>>{

    private static final LiveTestsMapper INSTANCE = new LiveTestsMapper();

    public static LiveTestsMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public List<LiveTests> map(TestModel testModel) {
        if (testModel.getScenarioTests() == null) {
            return new ArrayList<>();
        }
        return testModel.getScenarioTests().stream().map(scenarioTest -> {
            LiveTests liveTests = new LiveTests(getFilename(scenarioTest.getFilePath()));
            liveTests.addTestCases(scenarioTest.getScenarios().stream().map(testScenario -> {
                LiveTestCase liveTestCase = new LiveTestCase(CodeNamer.toCamelCase(testScenario.getScenario()), testScenario.getDescription());
                liveTestCase.addTestSteps(testScenario.getResolvedSteps().stream()
                    // future work: support other step types, for now only support example file
                    .filter(scenarioStep -> scenarioStep.getType() == TestScenarioStepType.REST_CALL &&
                        scenarioStep.getExampleFile() != null)
                    .map((Function<ScenarioStep, LiveTestStep>) scenarioStep -> {
                        Map<String, Object> example = new HashMap<>();
                        example.put("parameters", scenarioStep.getRequestParameters());
                        XmsExampleWrapper exampleWrapper = new XmsExampleWrapper(example, scenarioStep.getOperationId(), scenarioStep.getExampleName());
                        ProxyMethodExample proxyMethodExample = Mappers.getProxyMethodExampleMapper().map(exampleWrapper);
                        return ExampleLiveTestStep.newBuilder()
                            .operationId(scenarioStep.getOperationId())
                            .description(scenarioStep.getDescription())
                            .example(proxyMethodExample)
                            .build();
                    })
                    .collect(Collectors.toList()));
                return liveTestCase;
            }).collect(Collectors.toList()));
            return liveTests;
        }).collect(Collectors.toList());
    }

    private static String getFilename(String filePath) {
        String[] split = filePath.replace("\\\\", "/").split("/");
        String filename = split[split.length - 1];
        filename = filename.split("\\.")[0];
        return CodeNamer.toPascalCase(filename);
    }
}
