package com.microsoft.provisioning.http.client.generator.provisioning.model;

import com.azure.core.management.AzureEnvironment;
import com.azure.core.management.profile.AzureProfile;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.resourcemanager.AzureResourceManager;
import com.azure.resourcemanager.resources.fluentcore.arm.ResourceId;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public abstract class Specification extends ModelBase {
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

    private Set<String> providerNames = new HashSet<>();

    private boolean skipCleaning = false;
    private List<Resource> resources = new ArrayList<>();

    private List<Role> roles = new ArrayList<>();

    private String docComments;

    private Map<String, ModelBase> modelNameMapping = new HashMap<>();

    private final Map<FluentResourceModel, ModelBase> modelArmTypeMapping = new HashMap<>();

    private final List<FluentResourceModel> resourceModels;

    private final Map<String, Resource> resourcePathModelMap = new HashMap<>();

    private final Map<ClientModel, FluentResourceModel> resourceModelMap = new HashMap<>();

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

    public Map<FluentResourceModel, ModelBase> getModelArmTypeMapping() {
        return modelArmTypeMapping;
    }

    public Specification(String name, String provisioningPackage, String baseDir,
        List<FluentResourceModel> resourceModels) {
        super(name, provisioningPackage, null, null);
        this.baseDir = baseDir + "/sdk/" + name;
        TypeRegistry.register(this);
        this.resourceModels = resourceModels;
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
            String pomTemplate
                = new String(this.getClass().getClassLoader().getResourceAsStream("pom-template.xml").readAllBytes());
            pomTemplate = pomTemplate.replace("{artifact-name}",
                getProvisioningPackage().replace("com.", "").replace(".", "-"));

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
        this.resources = resourceModels.stream()
            .filter(resourceModel -> resourceModel.getResourceCreate() != null)
            .map(resourceModel -> {
                Resource resource = new Resource(this, resourceModel);
                this.modelNameMapping.put(resource.getName(), resource);
                this.modelArmTypeMapping.put(resourceModel, resource);
                this.resourcePathModelMap.put(resourceModel.getResourceCreate().getUrlPathSegments().getPath(),
                    resource);
                this.resourceModelMap.put(resourceModel.getInnerModel(), resourceModel);
                // FIXME parse provider namespace from scope resource url
                if (!resourceModel.getResourceCreate().getUrlPathSegments().hasScope()) {
                    ResourceId resourceId = ResourceId.fromString(resourceModel.getResourceCreate().getUrlPathSegments().getPath());
                    this.providerNames.add(resourceId.providerNamespace());
                    resource.setResourceNamespace(resourceId.fullResourceType());
                }
                return resource;
            })
            .toList();
        this.resources.forEach(resource -> {
            resource.setProvisioningPackage(this.getProvisioningPackage());
            if (!resource.getResourceModel().getResourceCreate().getUrlPathSegments().hasScope()) {
                ResourceId resourceId = ResourceId
                    .fromString(resource.getResourceModel().getResourceCreate().getUrlPathSegments().getPath());
                if (resourceId.parent() != null) {
                    Resource parent = this.resourcePathModelMap.get(resourceId.parent().toString());
                    if (parent != null) {
                        resource.setParentResource(parent);
                    }
                }
                resource.setResourceType(resourceId.fullResourceType());
            }
            resource.setProperties(parseProperties(resource));
        });

        try {
            this.providerNames.forEach(providerName -> AZURE_RESOURCE_MANAGER.providers()
                .getByName(providerName)
                .resourceTypes()
                .forEach(resourceType -> {
                    this.resources.stream()
                        .filter(resource -> resource.getResourceNamespace() != null)
                        .forEach(resource -> {
                            if (resource.getResourceNamespace()
                                .equals(providerName + "/" + resourceType.resourceType())) {
                                List<String> stableVersions = resourceType.apiVersions()
                                    .stream()
                                    .filter(apiVersion -> !apiVersion.contains("preview"))
                                    .collect(Collectors.toUnmodifiableList());
                                resource.setResourceVersions(stableVersions);
                                if (stableVersions.isEmpty()) {
                                    resource.setResourceVersions(
                                        resourceType.apiVersions().stream().sorted().collect(Collectors.toList()));
                                }
                                resource.setDefaultResourceVersion(
                                    resource.getResourceVersions().get(resource.getResourceVersions().size() - 1));
                            }
                        });
                }));
        } catch (Exception e) {
            // FIXME what we do in case of invalid provider namespace
            e.printStackTrace();
        }
    }

    private Set<Property> parseProperties(Resource resource) {
        FluentResourceModel resourceModel = resource.getResourceModel();
        ClientModel clientModel = resourceModel.getInnerModel();
        return parseProperties(clientModel, resource);
    }

    private ModelBase getPropertyType(IType wireType, Resource resource) {
        if (wireType instanceof ListType) {
            ListModel listModel = new ListModel(getPropertyType(((ListType) wireType).getElementType(), resource));
            listModel.setProvisioningPackage(List.class.getPackageName());
            listModel.setSpec(this);
            return listModel;
        } else if (wireType instanceof MapType) {
            DictionaryModel dictionaryModel
                = new DictionaryModel(getPropertyType(((MapType) wireType).getValueType(), resource));
            dictionaryModel.setProvisioningPackage(Map.class.getPackageName());
            dictionaryModel.setSpec(this);
            return dictionaryModel;
        } else if (wireType instanceof EnumType) {
            EnumModel enumModel = new EnumModel(((EnumType) wireType).getName(), this.getProvisioningPackage(),
                ((EnumType) wireType).getValues().stream().map(ClientEnumValue::getValue).collect(Collectors.toList()));
            enumModel.setSpec(this);
            modelNameMapping.put(((EnumType) wireType).getName(), enumModel);
            return enumModel;
        } else if (ClientModelUtil.isClientModel(wireType)) {
            ModelBase model;
            ClientModel clientModel = ClientModelUtil.getClientModel(((ClassType) wireType).getName());
            if ((model = TypeRegistry.get(clientModel)) != null) {
                return model;
            }
            ClassType classType = (ClassType) wireType;
            String packageName = this.getProvisioningPackage();
            if (!this.resourceModelMap.containsKey(clientModel)) {
                packageName += ".models";
            }
            SimpleModel simpleModel
                = new SimpleModel(this, resource.getArmType(), classType.getName(), packageName, null);
            simpleModel.setProperties(
                parseProperties(ClientModelUtil.getClientModel(((ClassType) wireType).getName()), resource));
            simpleModel.setSpec(this);
            modelNameMapping.put(classType.getName(), simpleModel);
            return simpleModel;
        } else if (wireType instanceof PrimitiveType) {
            ExternalModel externalModel = new ExternalModel(((PrimitiveType) wireType).getName(), "java.lang");
            externalModel.setExternal(true);
            TypeRegistry.register(externalModel);
            return externalModel;
        } else if (wireType instanceof ClassType) {
            ExternalModel externalModel
                = new ExternalModel(((ClassType) wireType).getName(), ((ClassType) wireType).getPackage());
            externalModel.setExternal(true);
            externalModel.setSpec(this);
            TypeRegistry.register(externalModel);
            return externalModel;
        } else {
            throw new IllegalArgumentException("Unsupported wireType: " + wireType);
        }
    }

    private Set<Property> parseProperties(ClientModel clientModel, Resource resource) {
        return clientModel.getProperties()
            .stream()
            .map(clientModelProperty -> new Property(resource,
                getPropertyType(clientModelProperty.getWireType(), resource), clientModelProperty.getSerializedName()))
            .collect(Collectors.toSet());
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
