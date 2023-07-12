[JS Api](../index.md) / JsonSchemaEmitter

# Class: JsonSchemaEmitter

## Hierarchy

- `TypeEmitter`<`Record`<`string`, `any`\>, [`JSONSchemaEmitterOptions`](../interfaces/JSONSchemaEmitterOptions.md)\>

  ↳ **`JsonSchemaEmitter`**

## Table of contents

### Constructors

- [constructor](JsonSchemaEmitter.md#constructor)

### Properties

- [#refToDecl](JsonSchemaEmitter.md##reftodecl)
- [#seenIds](JsonSchemaEmitter.md##seenids)
- [#typeForSourceFile](JsonSchemaEmitter.md##typeforsourcefile)
- [emitter](JsonSchemaEmitter.md#emitter)

### Methods

- [#applyConstraints](JsonSchemaEmitter.md##applyconstraints)
- [#checkForDuplicateId](JsonSchemaEmitter.md##checkforduplicateid)
- [#createDeclaration](JsonSchemaEmitter.md##createdeclaration)
- [#fileExtension](JsonSchemaEmitter.md##fileextension)
- [#getCurrentSourceFile](JsonSchemaEmitter.md##getcurrentsourcefile)
- [#getDeclId](JsonSchemaEmitter.md##getdeclid)
- [#isStdType](JsonSchemaEmitter.md##isstdtype)
- [#newFileScope](JsonSchemaEmitter.md##newfilescope)
- [#requiredModelProperties](JsonSchemaEmitter.md##requiredmodelproperties)
- [#scalarBuiltinBaseType](JsonSchemaEmitter.md##scalarbuiltinbasetype)
- [arrayDeclaration](JsonSchemaEmitter.md#arraydeclaration)
- [arrayDeclarationContext](JsonSchemaEmitter.md#arraydeclarationcontext)
- [arrayDeclarationReferenceContext](JsonSchemaEmitter.md#arraydeclarationreferencecontext)
- [arrayLiteral](JsonSchemaEmitter.md#arrayliteral)
- [arrayLiteralContext](JsonSchemaEmitter.md#arrayliteralcontext)
- [arrayLiteralReferenceContext](JsonSchemaEmitter.md#arrayliteralreferencecontext)
- [booleanLiteral](JsonSchemaEmitter.md#booleanliteral)
- [booleanLiteralContext](JsonSchemaEmitter.md#booleanliteralcontext)
- [declarationName](JsonSchemaEmitter.md#declarationname)
- [enumDeclaration](JsonSchemaEmitter.md#enumdeclaration)
- [enumDeclarationContext](JsonSchemaEmitter.md#enumdeclarationcontext)
- [enumMember](JsonSchemaEmitter.md#enummember)
- [enumMemberContext](JsonSchemaEmitter.md#enummembercontext)
- [enumMemberReference](JsonSchemaEmitter.md#enummemberreference)
- [enumMembers](JsonSchemaEmitter.md#enummembers)
- [enumMembersContext](JsonSchemaEmitter.md#enummemberscontext)
- [interfaceDeclaration](JsonSchemaEmitter.md#interfacedeclaration)
- [interfaceDeclarationContext](JsonSchemaEmitter.md#interfacedeclarationcontext)
- [interfaceDeclarationOperations](JsonSchemaEmitter.md#interfacedeclarationoperations)
- [interfaceDeclarationReferenceContext](JsonSchemaEmitter.md#interfacedeclarationreferencecontext)
- [interfaceOperationDeclaration](JsonSchemaEmitter.md#interfaceoperationdeclaration)
- [interfaceOperationDeclarationContext](JsonSchemaEmitter.md#interfaceoperationdeclarationcontext)
- [interfaceOperationDeclarationReferenceContext](JsonSchemaEmitter.md#interfaceoperationdeclarationreferencecontext)
- [intrinsic](JsonSchemaEmitter.md#intrinsic)
- [intrinsicContext](JsonSchemaEmitter.md#intrinsiccontext)
- [modelDeclaration](JsonSchemaEmitter.md#modeldeclaration)
- [modelDeclarationContext](JsonSchemaEmitter.md#modeldeclarationcontext)
- [modelDeclarationReferenceContext](JsonSchemaEmitter.md#modeldeclarationreferencecontext)
- [modelInstantiation](JsonSchemaEmitter.md#modelinstantiation)
- [modelInstantiationContext](JsonSchemaEmitter.md#modelinstantiationcontext)
- [modelInstantiationReferenceContext](JsonSchemaEmitter.md#modelinstantiationreferencecontext)
- [modelLiteral](JsonSchemaEmitter.md#modelliteral)
- [modelLiteralContext](JsonSchemaEmitter.md#modelliteralcontext)
- [modelLiteralReferenceContext](JsonSchemaEmitter.md#modelliteralreferencecontext)
- [modelProperties](JsonSchemaEmitter.md#modelproperties)
- [modelPropertiesContext](JsonSchemaEmitter.md#modelpropertiescontext)
- [modelPropertiesReferenceContext](JsonSchemaEmitter.md#modelpropertiesreferencecontext)
- [modelPropertyLiteral](JsonSchemaEmitter.md#modelpropertyliteral)
- [modelPropertyLiteralContext](JsonSchemaEmitter.md#modelpropertyliteralcontext)
- [modelPropertyLiteralReferenceContext](JsonSchemaEmitter.md#modelpropertyliteralreferencecontext)
- [modelPropertyReference](JsonSchemaEmitter.md#modelpropertyreference)
- [namespace](JsonSchemaEmitter.md#namespace)
- [namespaceContext](JsonSchemaEmitter.md#namespacecontext)
- [namespaceReferenceContext](JsonSchemaEmitter.md#namespacereferencecontext)
- [numericLiteral](JsonSchemaEmitter.md#numericliteral)
- [numericLiteralContext](JsonSchemaEmitter.md#numericliteralcontext)
- [operationDeclaration](JsonSchemaEmitter.md#operationdeclaration)
- [operationDeclarationContext](JsonSchemaEmitter.md#operationdeclarationcontext)
- [operationDeclarationReferenceContext](JsonSchemaEmitter.md#operationdeclarationreferencecontext)
- [operationParameters](JsonSchemaEmitter.md#operationparameters)
- [operationParametersContext](JsonSchemaEmitter.md#operationparameterscontext)
- [operationParametersReferenceContext](JsonSchemaEmitter.md#operationparametersreferencecontext)
- [operationReturnType](JsonSchemaEmitter.md#operationreturntype)
- [operationReturnTypeContext](JsonSchemaEmitter.md#operationreturntypecontext)
- [operationReturnTypeReferenceContext](JsonSchemaEmitter.md#operationreturntypereferencecontext)
- [programContext](JsonSchemaEmitter.md#programcontext)
- [reference](JsonSchemaEmitter.md#reference)
- [scalarDeclaration](JsonSchemaEmitter.md#scalardeclaration)
- [scalarDeclarationContext](JsonSchemaEmitter.md#scalardeclarationcontext)
- [scalarInstantiation](JsonSchemaEmitter.md#scalarinstantiation)
- [scalarInstantiationContext](JsonSchemaEmitter.md#scalarinstantiationcontext)
- [sourceFile](JsonSchemaEmitter.md#sourcefile)
- [stringLiteral](JsonSchemaEmitter.md#stringliteral)
- [stringLiteralContext](JsonSchemaEmitter.md#stringliteralcontext)
- [tupleLiteral](JsonSchemaEmitter.md#tupleliteral)
- [tupleLiteralContext](JsonSchemaEmitter.md#tupleliteralcontext)
- [tupleLiteralReferenceContext](JsonSchemaEmitter.md#tupleliteralreferencecontext)
- [tupleLiteralValues](JsonSchemaEmitter.md#tupleliteralvalues)
- [unionDeclaration](JsonSchemaEmitter.md#uniondeclaration)
- [unionDeclarationContext](JsonSchemaEmitter.md#uniondeclarationcontext)
- [unionDeclarationReferenceContext](JsonSchemaEmitter.md#uniondeclarationreferencecontext)
- [unionInstantiation](JsonSchemaEmitter.md#unioninstantiation)
- [unionInstantiationContext](JsonSchemaEmitter.md#unioninstantiationcontext)
- [unionInstantiationReferenceContext](JsonSchemaEmitter.md#unioninstantiationreferencecontext)
- [unionLiteral](JsonSchemaEmitter.md#unionliteral)
- [unionLiteralContext](JsonSchemaEmitter.md#unionliteralcontext)
- [unionLiteralReferenceContext](JsonSchemaEmitter.md#unionliteralreferencecontext)
- [unionVariant](JsonSchemaEmitter.md#unionvariant)
- [unionVariantContext](JsonSchemaEmitter.md#unionvariantcontext)
- [unionVariantReferenceContext](JsonSchemaEmitter.md#unionvariantreferencecontext)
- [unionVariants](JsonSchemaEmitter.md#unionvariants)
- [unionVariantsContext](JsonSchemaEmitter.md#unionvariantscontext)
- [unionVariantsReferenceContext](JsonSchemaEmitter.md#unionvariantsreferencecontext)
- [writeOutput](JsonSchemaEmitter.md#writeoutput)

## Constructors

### constructor

• **new JsonSchemaEmitter**(`emitter`)

Constructs a TypeEmitter. Do not use this constructor directly, instead
call `createAssetEmitter` on the emitter context object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `AssetEmitter`<`Record`<`string`, `any`\>, [`JSONSchemaEmitterOptions`](../interfaces/JSONSchemaEmitterOptions.md)\> | The asset emitter |

#### Inherited from

TypeEmitter<Record<string, any\>, JSONSchemaEmitterOptions\>.constructor

## Properties

### #refToDecl

• `Private` **#refToDecl**: `Map`<`string`, `Declaration`<`Record`<`string`, `unknown`\>\>\>

___

### #seenIds

• `Private` **#seenIds**: `Set`<`unknown`\>

___

### #typeForSourceFile

• `Private` **#typeForSourceFile**: `Map`<`SourceFile`<`any`\>, [`JsonSchemaDeclaration`](../index.md#jsonschemadeclaration)\>

___

### emitter

• `Protected` **emitter**: `AssetEmitter`<`Record`<`string`, `any`\>, [`JSONSchemaEmitterOptions`](../interfaces/JSONSchemaEmitterOptions.md)\>

#### Inherited from

TypeEmitter.emitter

## Methods

### #applyConstraints

▸ `Private` **#applyConstraints**(`type`, `schema`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `Model` \| `ModelProperty` \| `Scalar` \| `Enum` \| `Union` |
| `schema` | `ObjectBuilder`<`unknown`\> |

#### Returns

`void`

___

### #checkForDuplicateId

▸ `Private` **#checkForDuplicateId**(`id`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`string`

___

### #createDeclaration

▸ `Private` **#createDeclaration**(`type`, `name`, `schema`): `Declaration`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`JsonSchemaDeclaration`](../index.md#jsonschemadeclaration) |
| `name` | `string` |
| `schema` | `ObjectBuilder`<`unknown`\> |

#### Returns

`Declaration`<`Record`<`string`, `any`\>\>

___

### #fileExtension

▸ `Private` **#fileExtension**(): ``"json"`` \| ``"yaml"``

#### Returns

``"json"`` \| ``"yaml"``

___

### #getCurrentSourceFile

▸ `Private` **#getCurrentSourceFile**(): `SourceFile`<`object`\>

#### Returns

`SourceFile`<`object`\>

___

### #getDeclId

▸ `Private` **#getDeclId**(`type`, `name`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`JsonSchemaDeclaration`](../index.md#jsonschemadeclaration) |
| `name` | `string` |

#### Returns

`string`

___

### #isStdType

▸ `Private` **#isStdType**(`type`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `Type` |

#### Returns

`boolean`

___

### #newFileScope

▸ `Private` **#newFileScope**(`type`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`JsonSchemaDeclaration`](../index.md#jsonschemadeclaration) |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `scope` | `Scope`<`Record`<`string`, `any`\>\> |

___

### #requiredModelProperties

▸ `Private` **#requiredModelProperties**(`model`): `undefined` \| `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`undefined` \| `string`[]

___

### #scalarBuiltinBaseType

▸ `Private` **#scalarBuiltinBaseType**(`scalar`): ``null`` \| `Scalar`

#### Parameters

| Name | Type |
| :------ | :------ |
| `scalar` | `Scalar` |

#### Returns

``null`` \| `Scalar`

___

### arrayDeclaration

▸ **arrayDeclaration**(`array`, `name`, `elementType`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `Model` |
| `name` | `string` |
| `elementType` | `Type` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.arrayDeclaration

___

### arrayDeclarationContext

▸ **arrayDeclarationContext**(`array`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `Model` |

#### Returns

`Context`

#### Overrides

TypeEmitter.arrayDeclarationContext

___

### arrayDeclarationReferenceContext

▸ **arrayDeclarationReferenceContext**(`array`, `name`, `elementType`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `Model` |
| `name` | `string` |
| `elementType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayDeclarationReferenceContext

___

### arrayLiteral

▸ **arrayLiteral**(`array`, `elementType`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `Model` |
| `elementType` | `Type` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.arrayLiteral

___

### arrayLiteralContext

▸ **arrayLiteralContext**(`array`, `elementType`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `Model` |
| `elementType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayLiteralContext

___

### arrayLiteralReferenceContext

▸ **arrayLiteralReferenceContext**(`array`, `elementType`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `Model` |
| `elementType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.arrayLiteralReferenceContext

___

### booleanLiteral

▸ **booleanLiteral**(`boolean`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `boolean` | `BooleanLiteral` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.booleanLiteral

___

### booleanLiteralContext

▸ **booleanLiteralContext**(`boolean`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `boolean` | `BooleanLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.booleanLiteralContext

___

### declarationName

▸ **declarationName**(`declarationType`): `undefined` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `declarationType` | `TypeSpecDeclaration` |

#### Returns

`undefined` \| `string`

#### Inherited from

TypeEmitter.declarationName

___

### enumDeclaration

▸ **enumDeclaration**(`en`, `name`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `en` | `Enum` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.enumDeclaration

___

### enumDeclarationContext

▸ **enumDeclarationContext**(`en`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `en` | `Enum` |

#### Returns

`Context`

#### Overrides

TypeEmitter.enumDeclarationContext

___

### enumMember

▸ **enumMember**(`member`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.enumMember

___

### enumMemberContext

▸ **enumMemberContext**(`member`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`Object`

#### Inherited from

TypeEmitter.enumMemberContext

___

### enumMemberReference

▸ **enumMemberReference**(`member`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `member` | `EnumMember` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Overrides

TypeEmitter.enumMemberReference

___

### enumMembers

▸ **enumMembers**(`en`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `en` | `Enum` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.enumMembers

___

### enumMembersContext

▸ **enumMembersContext**(`en`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `en` | `Enum` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.enumMembersContext

___

### interfaceDeclaration

▸ **interfaceDeclaration**(`iface`, `name`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `iface` | `Interface` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.interfaceDeclaration

___

### interfaceDeclarationContext

▸ **interfaceDeclarationContext**(`iface`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `iface` | `Interface` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationContext

___

### interfaceDeclarationOperations

▸ **interfaceDeclarationOperations**(`iface`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `iface` | `Interface` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.interfaceDeclarationOperations

___

### interfaceDeclarationReferenceContext

▸ **interfaceDeclarationReferenceContext**(`iface`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `iface` | `Interface` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceDeclarationReferenceContext

___

### interfaceOperationDeclaration

▸ **interfaceOperationDeclaration**(`operation`, `name`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.interfaceOperationDeclaration

___

### interfaceOperationDeclarationContext

▸ **interfaceOperationDeclarationContext**(`operation`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceOperationDeclarationContext

___

### interfaceOperationDeclarationReferenceContext

▸ **interfaceOperationDeclarationReferenceContext**(`operation`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.interfaceOperationDeclarationReferenceContext

___

### intrinsic

▸ **intrinsic**(`intrinsic`, `name`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `intrinsic` | `IntrinsicType` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.intrinsic

___

### intrinsicContext

▸ **intrinsicContext**(`intrinsic`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `intrinsic` | `IntrinsicType` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.intrinsicContext

___

### modelDeclaration

▸ **modelDeclaration**(`model`, `name`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.modelDeclaration

___

### modelDeclarationContext

▸ **modelDeclarationContext**(`model`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `string` |

#### Returns

`Context`

#### Overrides

TypeEmitter.modelDeclarationContext

___

### modelDeclarationReferenceContext

▸ **modelDeclarationReferenceContext**(`model`, `name`): `Context`

Set reference context for a model declaration.

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelDeclarationReferenceContext

___

### modelInstantiation

▸ **modelInstantiation**(`model`, `name`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `undefined` \| `string` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Overrides

TypeEmitter.modelInstantiation

___

### modelInstantiationContext

▸ **modelInstantiationContext**(`model`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `undefined` \| `string` |

#### Returns

`Context`

#### Overrides

TypeEmitter.modelInstantiationContext

___

### modelInstantiationReferenceContext

▸ **modelInstantiationReferenceContext**(`model`, `name`): `Context`

Set reference context for a model declaration.

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |
| `name` | `undefined` \| `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelInstantiationReferenceContext

___

### modelLiteral

▸ **modelLiteral**(`model`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.modelLiteral

___

### modelLiteralContext

▸ **modelLiteralContext**(`model`): `Context`

Set lexical context for a model literal.

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelLiteralContext

___

### modelLiteralReferenceContext

▸ **modelLiteralReferenceContext**(`model`): `Context`

Set reference context for a model literal.

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelLiteralReferenceContext

___

### modelProperties

▸ **modelProperties**(`model`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.modelProperties

___

### modelPropertiesContext

▸ **modelPropertiesContext**(`model`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertiesContext

___

### modelPropertiesReferenceContext

▸ **modelPropertiesReferenceContext**(`model`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `model` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertiesReferenceContext

___

### modelPropertyLiteral

▸ **modelPropertyLiteral**(`property`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.modelPropertyLiteral

___

### modelPropertyLiteralContext

▸ **modelPropertyLiteralContext**(`property`): `Context`

Set lexical context for a property of a model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertyLiteralContext

___

### modelPropertyLiteralReferenceContext

▸ **modelPropertyLiteralReferenceContext**(`property`): `Context`

Set reference context for a property of a model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.modelPropertyLiteralReferenceContext

___

### modelPropertyReference

▸ **modelPropertyReference**(`property`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.modelPropertyReference

___

### namespace

▸ **namespace**(`namespace`): `EmitterOutput`<`Record`<`string`, `any`\>\>

Emit a namespace

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `Namespace` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

Emitter output

#### Inherited from

TypeEmitter.namespace

___

### namespaceContext

▸ **namespaceContext**(`namespace`): `Context`

Set lexical context for a namespace

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `Namespace` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.namespaceContext

___

### namespaceReferenceContext

▸ **namespaceReferenceContext**(`namespace`): `Context`

Set reference context for a namespace.

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `Namespace` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.namespaceReferenceContext

___

### numericLiteral

▸ **numericLiteral**(`number`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `number` | `NumericLiteral` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.numericLiteral

___

### numericLiteralContext

▸ **numericLiteralContext**(`number`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `number` | `NumericLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.numericLiteralContext

___

### operationDeclaration

▸ **operationDeclaration**(`operation`, `name`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.operationDeclaration

___

### operationDeclarationContext

▸ **operationDeclarationContext**(`operation`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationDeclarationContext

___

### operationDeclarationReferenceContext

▸ **operationDeclarationReferenceContext**(`operation`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationDeclarationReferenceContext

___

### operationParameters

▸ **operationParameters**(`operation`, `parameters`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `parameters` | `Model` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.operationParameters

___

### operationParametersContext

▸ **operationParametersContext**(`operation`, `parameters`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `parameters` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationParametersContext

___

### operationParametersReferenceContext

▸ **operationParametersReferenceContext**(`operation`, `parameters`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `parameters` | `Model` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationParametersReferenceContext

___

### operationReturnType

▸ **operationReturnType**(`operation`, `returnType`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `returnType` | `Type` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.operationReturnType

___

### operationReturnTypeContext

▸ **operationReturnTypeContext**(`operation`, `returnType`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `returnType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationReturnTypeContext

___

### operationReturnTypeReferenceContext

▸ **operationReturnTypeReferenceContext**(`operation`, `returnType`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Operation` |
| `returnType` | `Type` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.operationReturnTypeReferenceContext

___

### programContext

▸ **programContext**(`program`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |

#### Returns

`Context`

#### Overrides

TypeEmitter.programContext

___

### reference

▸ **reference**(`targetDeclaration`, `pathUp`, `pathDown`, `commonScope`): `object` \| `EmitEntity`<`Record`<`string`, `unknown`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetDeclaration` | `Declaration`<`Record`<`string`, `unknown`\>\> |
| `pathUp` | `Scope`<`Record`<`string`, `unknown`\>\>[] |
| `pathDown` | `Scope`<`Record`<`string`, `unknown`\>\>[] |
| `commonScope` | ``null`` \| `Scope`<`Record`<`string`, `unknown`\>\> |

#### Returns

`object` \| `EmitEntity`<`Record`<`string`, `unknown`\>\>

#### Overrides

TypeEmitter.reference

___

### scalarDeclaration

▸ **scalarDeclaration**(`scalar`, `name`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `scalar` | `Scalar` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.scalarDeclaration

___

### scalarDeclarationContext

▸ **scalarDeclarationContext**(`scalar`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `scalar` | `Scalar` |

#### Returns

`Context`

#### Overrides

TypeEmitter.scalarDeclarationContext

___

### scalarInstantiation

▸ **scalarInstantiation**(`scalar`, `name`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `scalar` | `Scalar` |
| `name` | `undefined` \| `string` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.scalarInstantiation

___

### scalarInstantiationContext

▸ **scalarInstantiationContext**(`scalar`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `scalar` | `Scalar` |
| `name` | `undefined` \| `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.scalarInstantiationContext

___

### sourceFile

▸ **sourceFile**(`sourceFile`): `EmittedSourceFile`

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceFile` | `SourceFile`<`object`\> |

#### Returns

`EmittedSourceFile`

#### Overrides

TypeEmitter.sourceFile

___

### stringLiteral

▸ **stringLiteral**(`string`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `string` | `StringLiteral` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.stringLiteral

___

### stringLiteralContext

▸ **stringLiteralContext**(`string`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `string` | `StringLiteral` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.stringLiteralContext

___

### tupleLiteral

▸ **tupleLiteral**(`tuple`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.tupleLiteral

___

### tupleLiteralContext

▸ **tupleLiteralContext**(`tuple`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.tupleLiteralContext

___

### tupleLiteralReferenceContext

▸ **tupleLiteralReferenceContext**(`tuple`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.tupleLiteralReferenceContext

___

### tupleLiteralValues

▸ **tupleLiteralValues**(`tuple`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `tuple` | `Tuple` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.tupleLiteralValues

___

### unionDeclaration

▸ **unionDeclaration**(`union`, `name`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.unionDeclaration

___

### unionDeclarationContext

▸ **unionDeclarationContext**(`union`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Overrides

TypeEmitter.unionDeclarationContext

___

### unionDeclarationReferenceContext

▸ **unionDeclarationReferenceContext**(`union`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionDeclarationReferenceContext

___

### unionInstantiation

▸ **unionInstantiation**(`union`, `name`): `EmitterOutput`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`EmitterOutput`<`Record`<`string`, `any`\>\>

#### Inherited from

TypeEmitter.unionInstantiation

___

### unionInstantiationContext

▸ **unionInstantiationContext**(`union`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionInstantiationContext

___

### unionInstantiationReferenceContext

▸ **unionInstantiationReferenceContext**(`union`, `name`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |
| `name` | `string` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionInstantiationReferenceContext

___

### unionLiteral

▸ **unionLiteral**(`union`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.unionLiteral

___

### unionLiteralContext

▸ **unionLiteralContext**(`union`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionLiteralContext

___

### unionLiteralReferenceContext

▸ **unionLiteralReferenceContext**(`union`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionLiteralReferenceContext

___

### unionVariant

▸ **unionVariant**(`variant`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `variant` | `UnionVariant` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.unionVariant

___

### unionVariantContext

▸ **unionVariantContext**(`union`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantContext

___

### unionVariantReferenceContext

▸ **unionVariantReferenceContext**(`union`): `Context`

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantReferenceContext

___

### unionVariants

▸ **unionVariants**(`union`): `EmitterOutput`<`object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | `Union` |

#### Returns

`EmitterOutput`<`object`\>

#### Overrides

TypeEmitter.unionVariants

___

### unionVariantsContext

▸ **unionVariantsContext**(): `Context`

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantsContext

___

### unionVariantsReferenceContext

▸ **unionVariantsReferenceContext**(): `Context`

#### Returns

`Context`

#### Inherited from

TypeEmitter.unionVariantsReferenceContext

___

### writeOutput

▸ **writeOutput**(`sourceFiles`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceFiles` | `SourceFile`<`Record`<`string`, `any`\>\>[] |

#### Returns

`Promise`<`void`\>

#### Overrides

TypeEmitter.writeOutput
