[Documentation](../index.md) / [http](../modules/http.md) / AutoRouteOptions

# Interface: AutoRouteOptions

[http](../modules/http.md).AutoRouteOptions

## Table of contents

### Properties

- [routeParamFilter](http.AutoRouteOptions.md#routeparamfilter)

## Properties

### routeParamFilter

• `Optional` **routeParamFilter**: (`op`: `Operation`, `param`: `ModelProperty`) => `undefined` \| [`FilteredRouteParam`](http.FilteredRouteParam.md)

#### Type declaration

▸ (`op`, `param`): `undefined` \| [`FilteredRouteParam`](http.FilteredRouteParam.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `op` | `Operation` |
| `param` | `ModelProperty` |

##### Returns

`undefined` \| [`FilteredRouteParam`](http.FilteredRouteParam.md)

#### Defined in

[http/types.ts:177](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L177)
