import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

@service({
    title: "Validation for MRW",
    version: "0.1.0",
})
@doc("This is a typespec project to validation the model reader writer functionalities.")
@server(
    "{endpoint}",
    "Endpoint Service",
    {
        endpoint: string,
    }
)
namespace ModelReaderWriterValidationTypeSpec;

using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using Azure.Core;

@doc("The model to change to struct.")
model ModelAsStruct {
    @doc("The id property.")
    id: int32;
}

@route("/api/ModelAsStruct")
@convenientAPI(true)
op op1(@body body: ModelAsStruct): ModelAsStruct;

model ModelWithPersistableOnly {
    @doc("The name.")
    name?: string;

    @doc("The fields property.")
    fields?: string[];

    @doc("The nullable property.")
    nullProperty?: int32;

    @doc("The key value pairs property.")
    keyValuePairs?: Record<string>;

    @doc("The x property.")
    @visibility("read")
    xProperty: int32;
}

@route("/api/ModelWithPersistableOnly")
@convenientAPI(true)
op op2(@body body: ModelWithPersistableOnly): ModelWithPersistableOnly;

@doc("The BaseModel in the discriminated set")
@discriminator("kind")
model BaseModel {
    @doc("The kind")
    kind: string;

    @doc("The name property.")
    name?: string;
}

@doc("The ModelX in the discriminated set")
model ModelX extends BaseModel {
    kind: "X";

    @doc("Optional list.")
    fields?: string[];

    @doc("Nullable integer.")
    nullProperty?: int32;

    @doc("Optional dictionary.")
    keyValuePairs?: Record<string>;

    @doc("The XProperty property.")
    @visibility("read")
    xProperty: int32;
}

@doc("The ModelY in the discriminated set")
model ModelY extends BaseModel {
    kind: "Y";

    @doc("The YProperty property.")
    @visibility("read")
    yProperty: string;
}

@route("/api/DiscriminatedSet")
@convenientAPI(true)
op op3(@body body: BaseModel): BaseModel;

@doc("The tracked resource data")
model TrackedResourceData {
    @doc("The id property.")
    @visibility("read")
    id: string;

    @doc("The name property.")
    @visibility("read")
    name: string;

    @doc("The resource type.")
    @visibility("read")
    @projectedName("csharp", "resourceType")
    type: string;

    @doc("The location property.")
    location: string;

    @doc("The tags property.")
    tags?: Record<string>;
}

@doc("The availability set data")
model AvailabilitySetData extends TrackedResourceData {
    @doc("The sku.")
    sku?: ComputeSku;

    @doc("The properties property.")
    properties?: AvailabilitySetProperties;
}

@doc("The availability set properties")
model AvailabilitySetProperties {
    @doc("The virtual machines.")
    virtualMachines?: WritableSubResource[];

    @doc("The platform fault domain count property.")
    platformFaultDomainCount?: int32;

    @doc("The platform update domain count property.")
    platformUpdateDomainCount?: int32;
}

model ComputeSku {
    @doc("The sku name.")
    name?: string;

    @doc("Specifies the tier of virtual machines in a scale set.&lt;br /&gt;&lt;br /&gt; Possible Values:&lt;br /&gt;&lt;br /&gt; **Standard**&lt;br /&gt;&lt;br /&gt; **Basic**.")
    tier?: string;

    @doc("Specifies the number of virtual machines in the scale set.")
    capacity?: int64;
}

@doc("The writable sub resource")
model WritableSubResource {
    @doc("The resource id")
    id?: string;
}

@route("/api/AvailabilitySet")
@convenientAPI(true)
op op4(@body body: AvailabilitySetData): AvailabilitySetData;

@doc("""
A class representing the ResourceProvider data model.
Resource provider information.
""")
model ResourceProviderData {
    @doc("The provider ID.")
    id?: string;

    @doc("The namespace of the resource provider.")
    `namespace`?: string;

    @doc("The registration state of the resource provider.")
    registrationState?: string;

    @doc("The registration policy of the resource provider.")
    registrationPolicy?: string;

    @doc("The collection of provider resource types.")
    resourceTypes?: ProviderResourceType[];

    @doc("The provider authorization consent state.")
    providerAuthorizationConsentState?: ProviderAuthorizationConsentState;
}

@doc("The provider authorization consent state.")
enum ProviderAuthorizationConsentState {
    @doc("The provider authorization consent state is not specified.")
    NotSpecified: "NotSpecified",

    @doc("The provider authorization consent state is required.")
    Required: "Required",

    @doc("The provider authorization consent state is not required.")
    NotRequired: "NotRequired",

    @doc("The provider authorization consent state is consented.")
    Consented: "Consented",
}

model ProviderResourceType {
    @doc("The resource type.")
    resourceType?: string;

    @doc("The collection of locations where this resource type can be created.")
    locations?: string[];

    @doc("The location mappings that are supported by this resource type.")
    locationMappings?: ProviderExtendedLocation[];

    @doc("The aliases that are supported by this resource type.")
    aliases?: ResourceTypeAlias[];

    @doc("The API version.")
    apiVersions?: string[];

    @doc("The default API version.")
    defaultApiVersion?: string;

    @doc("Gets the zone mappings.")
    zoneMappings?: ZoneMapping[];

    @doc("The API profiles for the resource provider.")
    apiProfiles?: ApiProfile[];

    @doc("The additional capabilities offered by this resource type.")
    capabilities?: string;

    @doc("The properties.")
    properties?: Record<string>;
}

@doc("The provider extended location.")
model ProviderExtendedLocation {
    @doc("The azure location.")
    location?: string; // TODO -- find if there is a way for azure-location

    @doc("The extended location type.")
    @projectedName("csharp", "providerExtendedLocationType")
    type?: string;

    @doc("The extended locations for the azure location.")
    extendedLocations?: string[];
}

@doc("The ZoneMapping.")
model ZoneMapping {
    @doc("The location of the zone mapping.")
    location?: string; // TODO -- find if there is a way for azure-location

    @doc("The zones.")
    zones?: string[];
}

model ApiProfile {
    @doc("The profile version.")
    profileVersion?: string;

    @doc("The API version.")
    apiVersion?: string;
}

@doc("The alias type.")
model ResourceTypeAlias {
    @doc("The alias name.")
    name?: string;

    @doc("The paths for an alias.")
    paths?: ResourceTypeAliasPath[];

    @doc("The type of the alias.")
    aliasType?: ResourceTypeAliasType;

    @doc("The default path for an alias.")
    defaultPath?: string;

    @doc("The default pattern for an alias.")
    defaultPattern?: ResourceTypeAliasPattern;

    @doc("The default alias path metadata. Applies to the default path and to any alias path that doesn't have metadata.")
    defaultMetadata?: ResourceTypeAliasPathMetadata;
}

@doc("The type of the paths for alias.")
model ResourceTypeAliasPath {
    @doc("The path of an alias.")
    path?: string;

    @doc("The API versions.")
    apiVersions?: string[];

    @doc("The pattern for an alias path.")
    pattern?: ResourceTypeAliasPattern;

    @doc("The metadata of the alias path. If missing, fall back to the default metadata of the alias.")
    metadata?: ResourceTypeAliasPathMetadata;
}

@doc("The type of the alias.")
@fixed
enum ResourceTypeAliasType {
    @doc("Alias type is unknown (same as not providing alias type).")
    NotSpecified,

    @doc("Alias value is not secret.")
    PlainText,

    @doc("Alias value is secret.")
    Mask,
}

@doc("The type of the pattern for an alias path.")
model ResourceTypeAliasPattern {
    @doc("The alias pattern phrase.")
    phrase?: string;

    @doc("The alias pattern variable.")
    variable?: string;

    @doc("The type of alias pattern.")
    patternType?: ResourceTypeAliasPatternType;
}

@doc("The ResourceTypeAliasPathMetadata.")
model ResourceTypeAliasPathMetadata {
    @doc("The type of the token that the alias path is referring to.")
    tokenType?: ResourceTypeAliasPathTokenType;

    @doc("The attributes of the token that the alias path is referring to.")
    attributes?: ResourceTypeAliasPathAttributes;
}

@doc("The type of alias pattern.")
@fixed
enum ResourceTypeAliasPatternType {
    @doc("NotSpecified is not allowed.")
    NotSpecified,

    @doc("Extract is the only allowed value.")
    Extract,
}

@doc("The type of the token that the alias path is referring to.")
enum ResourceTypeAliasPathTokenType {
    @doc("The token type is not specified.")
    NotSpecified: "NotSpecified";
    @doc("The token type can be anything.")
    Any: "Any";
    @doc("The token type is string.")
    String: "String";
    @doc("The token type is object.")
    Object: "Object";
    @doc("The token type is array.")
    Array: "Array";
    @doc("The token type is integer.")
    Integer: "Integer";
    @doc("The token type is number.")
    Number: "Number";
    @doc("The token type is boolean.")
    Boolean: "Boolean";
}

@doc("The attributes of the token that the alias path is referring to.")
enum ResourceTypeAliasPathAttributes {
    @doc("The token that the alias path is referring to has no attributes.")
    None: "None";
    @doc("The token that the alias path is referring to is modifiable by policies with 'modify' effect.")
    Modifiable: "Modifiable";
}

@route("/api/ResourceProvider")
@convenientAPI(true)
op op5(): ResourceProviderData;
