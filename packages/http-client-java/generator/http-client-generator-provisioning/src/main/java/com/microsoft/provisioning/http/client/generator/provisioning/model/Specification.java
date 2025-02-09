package com.microsoft.provisioning.http.client.generator.provisioning.model;

import com.azure.core.annotation.ServiceMethod;
import com.azure.core.http.rest.Response;
import com.azure.core.management.AzureEnvironment;
import com.azure.core.management.ProxyResource;
import com.azure.core.management.profile.AzureProfile;
import com.azure.core.util.logging.ClientLogger;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.provisioning.generator.Main;
import com.azure.resourcemanager.AzureResourceManager;
import com.azure.resourcemanager.resources.fluentcore.arm.ResourceId;
import com.microsoft.provisioning.http.client.generator.provisioning.utils.ReflectionUtils;
import com.microsoft.provisioning.http.client.generator.provisioning.utils.ResourceNamespaceMapper;
import org.reflections.Reflections;
import org.reflections.scanners.Scanners;
import org.reflections.util.ConfigurationBuilder;
import reactor.core.publisher.Mono;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;


public abstract class Specification extends ModelBase {
    public static final File BASE_DIR = new File(System.getProperty("user.dir"));
    /**
     * ArmClient used for talking to the service so it can fetch lists of
     * supported versions for resources.
     */
    private static final AzureResourceManager AZURE_RESOURCE_MANAGER = AzureResourceManager
            .authenticate(new DefaultAzureCredentialBuilder().build(), new AzureProfile(AzureEnvironment.AZURE))
            .withSubscription("faa080af-c1d8-40ad-9cce-e1a450ca5b57");
    private final String baseDir;


//    static final AzureResourceManager arm = AzureResourceManager.authenticate(
//                    HttpPipelineProvider.buildHttpPipeline(new DefaultAzureCredentialBuilder().build(),
//                            new AzureProfile(AzureEnvironment.AZURE), null, new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS), null, null,
//                            List.of((callContext, nextPolicy) -> {
//                                callContext.getHttpRequest().setUrl(callContext.getHttpRequest().getUrl().toString().replace("2024-03-01", "2024-05-01"));
//                                return nextPolicy.process();
//                            }), null),
//                    new AzureProfile(AzureEnvironment.AZURE))
//            .withSubscription("faa080af-c1d8-40ad-9cce-e1a450ca5b57");

    // Flag indicating we don't need to clean the output directory
    // because it's merged with another spec that'll handle that for us

    private String providerName;

    private boolean skipCleaning = false;
    private List<Resource> resources = new ArrayList<>();

    private List<Role> roles = new ArrayList<>();

    private String docComments;

    private Map<String, ModelBase> modelNameMapping = new HashMap<>();

    private Map<Type, ModelBase> modelArmTypeMapping = new HashMap<>();

    public boolean isSkipCleaning() {
        return skipCleaning;
    }

    public void setSkipCleaning(boolean skipCleaning) {
        this.skipCleaning = skipCleaning;
    }

    public List<Resource> getResources() {
        return resources;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public String getDocComments() {
        return docComments;
    }

    public Map<String, ModelBase> getModelNameMapping() {
        return modelNameMapping;
    }

    public Map<Type, ModelBase> getModelArmTypeMapping() {
        return modelArmTypeMapping;
    }

    public Specification(String name, String provisioningPackage, String baseDir) {
        super(name, provisioningPackage, null, null);
        this.baseDir = baseDir + "/sdk/" + getProvisioningPackage().replace("com.", "").replace(".", "-");
        TypeRegistry.register(this);
    }

    @Override
    public String toString() {
        return "<Specification " + getName() + ">";
    }

    public String getBaseDir() {
        return this.baseDir;
    }

    public void build() {
        analyze();
        customize();
        lint();

        generatePom();

        modelNameMapping.forEach((key, value) -> {
            value.generate();
        });

//        roles.forEach(role -> {generateBuiltInRoles();});
    }

    private void generatePom() {
        try {
            String pomTemplate = new String(this.getClass().getClassLoader().getResourceAsStream("pom-template.xml").readAllBytes());
            pomTemplate = pomTemplate.replace("{artifact-name}", getProvisioningPackage().replace("com.", "").replace(".", "-"));

            Path path = Paths.get(getBaseDir(), "pom.xml");
            if (!path.toFile().exists()) {
                System.out.println("Writing to " + path);
                Files.createDirectories(path.getParent());
                Files.write(path, pomTemplate.getBytes(StandardCharsets.UTF_8));
            } else {
                System.out.println("pom.xml already exists, ");
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    // Placeholder methods for analyze, customize, lint, and getGenerationPath
    public void analyze() {
        Map<Type, Method> resources = findConstructibleResources();
        this.resources = resources.keySet().stream().map(type -> {
            Resource resource = new Resource(this, type);
            this.modelNameMapping.put(resource.getName(), resource);
            this.modelArmTypeMapping.put(resource.getArmType(), resource);
            return resource;
        }).toList();
        this.resources.forEach(resource -> {
            resource.setProvisioningPackage(this.getProvisioningPackage() + ".generated");

            Method creatorMethod = resources.get(resource.getArmType());
            Field type = null;
            try {
                type = getType(resource);
                if (type != null) {
                    resource.setResourceType(type.getName());
                    String namespace = ResourceNamespaceMapper.getNamespace(resource.getArmType());
                    if (namespace == null) {
                        System.out.println("Cannot find namespace for " + resource.getArmType());
                        return;
                    }
                    resource.setResourceNamespace(namespace);
                    ResourceId resourceIdTemplate = ResourceNamespaceMapper.getResourceIdTemplate(resource.getArmType());
                    if (resourceIdTemplate.parent() != null) {
                        Type parentType = ResourceNamespaceMapper.getResourceType(resourceIdTemplate.parent());
                        if (parentType != null) {
                            resource.setParentResource((Resource) this.modelArmTypeMapping.get(parentType));
                        }
                    }
                }
            } catch (NoSuchFieldException e) {
                // do nothing - the field doesn't exist
            }
            resource.setProperties(findProperties(resource, creatorMethod, type));
        });

        AZURE_RESOURCE_MANAGER.providers()
                .getByName(this.providerName)
                .resourceTypes()
                .forEach(resourceType -> {
                    this.resources.stream()
                            .filter(resource -> resource.getResourceNamespace() != null)
                            .forEach(resource -> {
                                if (resource.getResourceNamespace().equals(providerName + "/" + resourceType.resourceType())) {
                                    List<String> stableVersions = resourceType.apiVersions()
                                            .stream()
                                            .filter(apiVersion -> !apiVersion.contains("preview"))
                                            .collect(Collectors.toUnmodifiableList());
                                    resource.setResourceVersions(stableVersions);
                                    if (stableVersions.isEmpty()) {
                                        resource.setResourceVersions(resourceType.apiVersions().stream().sorted().collect(Collectors.toList()));
                                    }
                                    resource.setDefaultResourceVersion(resource.getResourceVersions().getLast());
                                }
                            });
                });
    }

    private static Field getType(Resource resource) throws NoSuchFieldException {
        Class<?> currentClass = ((Class<?>) resource.getArmType());
        while (currentClass != null) {
            try {
                Field type = currentClass.getDeclaredField("type");
                if (type != null) {
                    return type;
                }
            } catch (NoSuchFieldException e) {
                // Do nothing
            }
            currentClass = currentClass.getSuperclass();
        }
        return null;
    }

    private Set<Property> findProperties(Resource resource, Method creatorMethod, Field field) {
        Set<Property> properties = new HashSet<>();
        properties.addAll(getPropertiesFromResource(resource, resource.getArmType()));

        return properties;
    }

    private Set<Property> getPropertiesFromResource(Resource resource, Parameter param) {
        Set<Property> properties = new HashSet<>();
        Class<?> currentType = param.getType();

        while (currentType != ProxyResource.class && currentType != null) {
            Arrays.stream(currentType.getDeclaredFields())
                    .filter(field -> field.getType() != ClientLogger.class)
                    .forEach(field -> {
                        if (ReflectionUtils.isSimpleType(field.getType())) {
                            Property property = new Property(resource, getOrCreateModelType(field.getType(), resource), field, null);
//                            property.setRequired(true);
                            properties.add(property);
                        } else if (ReflectionUtils.isPropertiesTypes(field)) {
                            properties.add(new Property(resource, getOrCreateModelType(field.getType(), resource), field, null));
                        }
                    });
            currentType = currentType.getSuperclass();
        }
        return properties;
    }

    private Set<Property> getPropertiesFromResource(Resource resource, Type type) {
        Set<Property> properties = new HashSet<>();
        Class<?> currentType = (Class<?>) type;

        while (currentType != ProxyResource.class && currentType != null) {
            Arrays.stream(currentType.getDeclaredFields())
                .filter(field -> field.getType() != ClientLogger.class && !field.getName().equals("id") && !field.getName().equals("type"))
                .forEach(field -> {
                    if (ReflectionUtils.isSimpleType(field.getType())) {
                        Property property = new Property(resource, getOrCreateModelType(field.getType(), resource), field, null);
//                            property.setRequired(true);
                        properties.add(property);
                    } else if (ReflectionUtils.isPropertiesTypes(field)) {
                        properties.add(new Property(resource, getOrCreateModelType(field.getType(), resource), field, null));
                    }
                });
            currentType = currentType.getSuperclass();
        }
        return properties;
    }

    private Set<Property> getPropertiesFromModel(Resource resource, Field field) {
        Set<Property> properties = new HashSet<>();

        Arrays.stream(field.getType().getDeclaredFields())
                .filter(f -> f.getType() != ClientLogger.class)
                .forEach(f -> {
                    handleField(resource, f, properties);
                });
        return properties;
    }

    private void handleField(Resource resource, Field f, Set<Property> properties) {
        if (ReflectionUtils.isSimpleType(f.getType())) {
            Property property = new Property(resource, getOrCreateModelType(f.getType(), resource), f, null);
//                        property.setRequired(true);
            properties.add(property);
        } else if (ReflectionUtils.isPropertiesTypes(f)) {
            properties.addAll(getPropertiesFromModel(resource, f));
        } else {
            ModelBase model;
            if (f.getType() == Map.class || f.getType() == List.class) {
                model = getOrCreateModelType(f.getGenericType(), resource);
            } else {
                model = getOrCreateModelType(f.getType(), resource);
            }

            Property property = new Property(resource, model, f, null);
            properties.add(property);
        }
    }

    private ModelBase getOrCreateModelType(Type type, Resource resource) {
        if (TypeRegistry.get(type) != null) {
            return TypeRegistry.get(type);
        }

        if (type instanceof ParameterizedType parameterizedType) {
            if (parameterizedType.getRawType() == List.class) {
                parameterizedType.getActualTypeArguments();
                ListModel listModel = new ListModel(getOrCreateModelType(parameterizedType.getActualTypeArguments()[0], resource));
                listModel.setProvisioningPackage(List.class.getPackageName());
                return listModel;
            }

            if (parameterizedType.getRawType() == Map.class) {
                DictionaryModel dictionaryModel = new DictionaryModel(getOrCreateModelType(parameterizedType.getActualTypeArguments()[1], resource));
                dictionaryModel.setProvisioningPackage(Map.class.getPackageName());
                return dictionaryModel;
            }
        }

        Class<?> classType = ((Class<?>) type);
        if (classType.getPackageName().startsWith("com.azure.resourcemanager")) {
            if (ReflectionUtils.isEnumType(classType)) {
                List<String> enumValues = ReflectionUtils.getEnumValues(classType);
                EnumModel enumModel = new EnumModel(classType.getSimpleName(), this.getProvisioningPackage() + ".generated.models", enumValues);
                enumModel.setSpec(this);
                modelNameMapping.putIfAbsent(classType.getName(), enumModel);
                return enumModel;
            }

            SimpleModel simpleModel = new SimpleModel(this, classType, classType.getSimpleName(), this.getProvisioningPackage() + ".generated.models", null);
            simpleModel.setProperties(getPropertiesFromModel(resource, classType));
            modelNameMapping.putIfAbsent(classType.getName(), simpleModel);
            return simpleModel;
        }
        ExternalModel externalModel = new ExternalModel(type);
        externalModel.setExternal(true);
        TypeRegistry.register(externalModel);
        return externalModel;
    }

    private Set<Property> getPropertiesFromModel(Resource resource, Class<?> type) {
        Set<Property> properties = new HashSet<>();
        Arrays.stream(type.getDeclaredFields())
                .forEach(f -> {
                    handleField(resource, f, properties);
                });
        return properties;
    }

    private Map<Type, Method> findConstructibleResources() {
        Map<Type, Method> resources = new HashMap<>();
        Reflections reflections = getReflections();
        ResourceNamespaceMapper.initializeNamespace(reflections);
        Set<Method> methodsAnnotatedWith = reflections.getMethodsAnnotatedWith(ServiceMethod.class);
        methodsAnnotatedWith.stream()
                .filter(method -> method.getName().startsWith("create"))
                .filter(method -> method.getReturnType() != Mono.class)
                .forEach(method -> {
                    if (method.getReturnType() == Response.class) {
                        // with response method overwrites the convenience overloads
                        Class<?> resource = (Class<?>)((ParameterizedType) method.getGenericReturnType()).getActualTypeArguments()[0];
                        if (ProxyResource.class.isAssignableFrom(resource)) {
                            resources.put(resource, method);
                        }
                    } else {
                        // add this only if the resource doesn't already exist
                        Class<?> resource = method.getReturnType();
                        if (ProxyResource.class.isAssignableFrom(resource)) {
                            resources.putIfAbsent(resource, method);
                        }
                    }
                });

        resources.keySet()
                .forEach(type -> {
                    Class<?> superType = ((Class<?>) type).getSuperclass();
                    if (resources.containsKey(superType)) {
                        throw new IllegalStateException("Unexpected derived type " + type + " of " + superType);
                    }
                });
        return resources;
    }

    protected abstract void customize();

    @Override
    public void lint() {
        super.lint();
        modelNameMapping.values().forEach(model -> {
            model.lint();
        });
    }

//    protected abstract String getGenerationPath();
//
//
//    protected <T> void customizeEnum(Consumer<EnumModel> action) {
//        action.accept(getEnum());
//    }
//
//    protected <T> void customizeModel(Consumer<ModelBase> action) {
//        action.accept(getModel());
//    }
//
//    protected void customizeModel(String modelName, Consumer<ModelBase> action) {
//        ModelBase model = Optional.ofNullable(getModelNameMapping().get(modelName))
//                .orElseThrow(() -> new IllegalStateException("Failed to find " + modelName + " to customize!"));
//        action.accept(model);
//    }
//
//    protected <T> void customizeProperty(String propertyName, Consumer<Property> action) {
//        customizeProperty(getModel(), propertyName, action);
//    }
//
//    protected void customizeProperty(String modelName, String propertyName, Consumer<Property> action) {
//        ModelBase model = Optional.ofNullable(getModelNameMapping().get(modelName))
//                .orElseThrow(() -> new IllegalStateException("Failed to find " + modelName + " to customize!"));
//        customizeProperty(model, propertyName, action);
//    }
//
//    private static void customizeProperty(ModelBase model, String propertyName, Consumer<Property> action) {
//        TypeModel typeModel = Optional.ofNullable((TypeModel) model)
//                .orElseThrow(() -> new IllegalStateException("Failed to find " + model.getName() + " to customize property!"));
//        Property property = typeModel.getProperties().stream()
//                .filter(p -> p.getName().equals(propertyName))
//                .findFirst()
//                .orElseThrow(() -> new IllegalStateException("Failed to find " + model.getName() + "." + propertyName + " to customize!"));
//        action.accept(property);
//    }
//
//    public <T> void removeProperty(String propertyName) {
//        TypeModel model = Optional.ofNullable((TypeModel) getModel())
//                .orElseThrow(() -> new IllegalStateException("Failed to find " + getModel().getClass().getName() + " to remove property!"));
//        Property property = model.getProperties().stream()
//                .filter(p -> p.getName().equals(propertyName))
//                .findFirst()
//                .orElseThrow(() -> new IllegalStateException("Failed to find property " + propertyName + " on type " + getModel().getClass().getName() + " to remove!"));
//        model.getProperties().remove(property);
//    }
//
//    public <T> void addNameRequirements(int max, int min, boolean lower, boolean upper, boolean digits, boolean hyphen, boolean underscore, boolean period, boolean parens) {
//        getResource().setNameRequirements(new NameRequirements(max, min, lower, upper, digits, hyphen, underscore, period, parens));
//    }
//
//    private String namespacePath = null;
//    private String generationPath = null;
//
//    /**
//     * Gets the namespace path, calculating it if it hasn't been set yet.
//     *
//     * @return the namespace path.
//     */
//    private String getNamespacePath() {
//        if (namespacePath != null) {
//            return namespacePath;
//        }
//
//        // TODO: This assumes we're always running in place, in the repo
//        String path = System.getProperty("user.dir");
//        while (path != null && !new File(path, ".git").exists()) {
//            // Walk up a level
//            path = new File(path).getParent();
//        }
//
//        // If all else fails, just use the current directory
//        if (path == null) {
//            path = System.getProperty("user.dir");
//        }
//
//        // Walk from the root of the repo into the provisioning folder
//        path = Paths.get(path, "sdk", "provisioning").toString();
//        if (!new File(path).exists()) {
//            throw new IllegalStateException("Directory " + path + " must exist to write " + getNamespace() + "!");
//        }
//
//        // Special case namespaces we're collapsing into the main Azure.Provisioning
//        String ns = switch (getNamespace()) {
//            case "Azure.Provisioning.Authorization", "Azure.Provisioning.Resources", "Azure.Provisioning.Roles" -> "Azure.Provisioning";
//            default -> getNamespace();
//        };
//
//        // Add on our namespace
//        if (ns != null) {
//            path = Paths.get(path, ns).toString();
//        }
//
//        namespacePath = path;
//        return namespacePath;
//    }
//
//    /**
//     * Gets the generation path, calculating it if it hasn't been set yet.
//     *
//     * @return the generation path.
//     */
//    private String getGenerationPath() {
//        if (generationPath != null) {
//            return generationPath;
//        }
//        // Implementation continues...
//        return null; // Placeholder return statement
//    }
}
