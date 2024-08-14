// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.AutorestSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.util.CoreUtils;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SwaggerReadmeTemplate {

    private final StringBuilder builder = new StringBuilder();

    private static final String NEW_LINE = System.lineSeparator();

    private static final Pattern MARKDOWN_YAML_BLOCK =
            Pattern.compile("```\\s?(?:yaml|YAML).*?\\n(.*?)```", Pattern.DOTALL);

    private static final Map<String, Object> OVERRIDE_OPTIONS = new LinkedHashMap<>();
    static {
        OVERRIDE_OPTIONS.put("output-folder", "../");
        OVERRIDE_OPTIONS.put("java", true);
        OVERRIDE_OPTIONS.put("regenerate-pom", false);
//        OVERRIDE_SETTINGS.put("partial-update", true);
        OVERRIDE_OPTIONS.put("sdk-integration", null);
    }

    private static final Map<String, Object> DEFAULT_OPTIONS = loadDefaultOptions();

    public String write(Project project) {
        JavaSettings settings = JavaSettings.getInstance();

        // prepare OVERRIDE_SETTINGS
        updateOverrideOptions(settings);

        // prepare YAML object
        DumperOptions dumperOptions = new DumperOptions();
        dumperOptions.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        Yaml yaml = new Yaml(dumperOptions);

        Map<String, Object> objectNode = new LinkedHashMap<>();
        addRequireOrInputFile(objectNode, settings.getAutorestSettings());
        // settings from internal
        for (Map.Entry<String, Object> entry : OVERRIDE_OPTIONS.entrySet()) {
            if (entry.getValue() != null) {
                objectNode.put(entry.getKey(), entry.getValue());
            }
        }
        // settings from external
        for (Map.Entry<String, Object> entry : settings.getSimpleJavaSettings().entrySet()) {
            if (!OVERRIDE_OPTIONS.containsKey(entry.getKey()) && entry.getValue() != null) {
                objectNode.put(entry.getKey(), entry.getValue());
            }
        }
        // service-versions
        objectNode.put("service-versions", project.getApiVersions());

        objectNode = removeDefaultOptions(objectNode);

        // write README
        line("## Generate autorest code");
        newLine();
        line("```yaml");
        builder.append(yaml.dump(objectNode));
        line("```");

        return builder.toString();
    }

    private static void addRequireOrInputFile(Map<String, Object> objectNode, AutorestSettings autorestSettings) {
        // try use "require"
        boolean useRequire = false;
        List<String> requireList = autorestSettings.getRequire();
        if (!CoreUtils.isNullOrEmpty(requireList)) {
            String require = requireList.iterator().next();

            if (require.contains("data-plane")) {
                useRequire = true;
                objectNode.put("require", require);
            }
        }

        if (!useRequire) {
            // use "input-file"
            objectNode.put("input-file", autorestSettings.getInputFiles());
        }
    }

    private static Map<String, Object> removeDefaultOptions(Map<String, Object> objectNode) {
        Map<String, Object> filteredNode = new LinkedHashMap<>();

        objectNode.entrySet().forEach(e -> {
            String key = e.getKey();
            if (!(DEFAULT_OPTIONS.containsKey(key) && Objects.equals(e.getValue(), DEFAULT_OPTIONS.get(key)))) {
                filteredNode.put(e.getKey(), e.getValue());
            }
        });

        return filteredNode;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> loadDefaultOptions() {
        Map<String, Object> defaultOptions = new LinkedHashMap<>();

        // the file is copied from javagen/data-plane.md to resources, using maven-resources-plugin
        String defaultDpgReadme = TemplateUtil.loadTextFromResource("data-plane.md");
        if (!CoreUtils.isNullOrEmpty(defaultDpgReadme)) {
            Matcher matcher = MARKDOWN_YAML_BLOCK.matcher(defaultDpgReadme);
            Yaml yaml = new Yaml();
            while (matcher.find()) {
                String yamlStr = matcher.group(1);
                Object yamlObj = yaml.load(yamlStr);
                if (yamlObj instanceof Map) {
                    Map<String, Object> yamlMap = (Map<String, Object>) yamlObj;
                    yamlMap.entrySet().forEach(e -> {
                        if (e.getValue() instanceof String
                                || e.getValue() instanceof Boolean
                                || e.getValue() instanceof Integer) {
                            defaultOptions.put(e.getKey(), e.getValue());
                        }
                    });
                }
            }
        }

        return defaultOptions;
    }

    private static void updateOverrideOptions(JavaSettings settings) {
        String title = settings.getAutorestSettings().getTitle();
        if (title != null) {
            OVERRIDE_OPTIONS.put("title", title);
        }

        if (!settings.getAutorestSettings().getSecurity().isEmpty()) {
            OVERRIDE_OPTIONS.putIfAbsent("security",
                    stringOrArray(settings.getAutorestSettings().getSecurity()));
        }
        if (!settings.getAutorestSettings().getSecurityScopes().isEmpty()) {
            OVERRIDE_OPTIONS.putIfAbsent("security-scopes",
                    stringOrArray(settings.getAutorestSettings().getSecurityScopes()));
        }

        String securityHeaderName = settings.getAutorestSettings().getSecurityHeaderName();
        if (securityHeaderName != null) {
            OVERRIDE_OPTIONS.put("security-header-name", securityHeaderName);
        }
    }

    private void line(String text) {
        builder.append(text);
        newLine();
    }

    private void newLine() {
        builder.append(NEW_LINE);
    }

    private static Object stringOrArray(List<String> array) {
        if (array.size() == 1) {
            return array.iterator().next();
        } else {
            return array;
        }
    }
}
