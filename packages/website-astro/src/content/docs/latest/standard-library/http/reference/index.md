---
title: Overview
sidebar_position: 0
toc_min_heading_level: 2
toc_max_heading_level: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Overview

TypeSpec HTTP protocol binding

## Install

<Tabs>
<TabItem value="spec" label="In a spec" default>

```bash
npm install @typespec/http
```

</TabItem>
<TabItem value="library" label="In a library" default>

```bash
npm install --save-peer @typespec/http
```

</TabItem>
</Tabs>

## TypeSpec.Http

### Decorators

- [`@body`](./decorators.md#@TypeSpec.Http.body)
- [`@delete`](./decorators.md#@TypeSpec.Http.delete)
- [`@get`](./decorators.md#@TypeSpec.Http.get)
- [`@head`](./decorators.md#@TypeSpec.Http.head)
- [`@header`](./decorators.md#@TypeSpec.Http.header)
- [`@includeInapplicableMetadataInPayload`](./decorators.md#@TypeSpec.Http.includeInapplicableMetadataInPayload)
- [`@patch`](./decorators.md#@TypeSpec.Http.patch)
- [`@path`](./decorators.md#@TypeSpec.Http.path)
- [`@post`](./decorators.md#@TypeSpec.Http.post)
- [`@put`](./decorators.md#@TypeSpec.Http.put)
- [`@query`](./decorators.md#@TypeSpec.Http.query)
- [`@route`](./decorators.md#@TypeSpec.Http.route)
- [`@server`](./decorators.md#@TypeSpec.Http.server)
- [`@sharedRoute`](./decorators.md#@TypeSpec.Http.sharedRoute)
- [`@statusCode`](./decorators.md#@TypeSpec.Http.statusCode)
- [`@useAuth`](./decorators.md#@TypeSpec.Http.useAuth)

### Models

- [`AcceptedResponse`](./data-types.md#TypeSpec.Http.AcceptedResponse)
- [`ApiKeyAuth`](./data-types.md#TypeSpec.Http.ApiKeyAuth)
- [`AuthorizationCodeFlow`](./data-types.md#TypeSpec.Http.AuthorizationCodeFlow)
- [`BadRequestResponse`](./data-types.md#TypeSpec.Http.BadRequestResponse)
- [`BasicAuth`](./data-types.md#TypeSpec.Http.BasicAuth)
- [`BearerAuth`](./data-types.md#TypeSpec.Http.BearerAuth)
- [`Body`](./data-types.md#TypeSpec.Http.Body)
- [`ClientCredentialsFlow`](./data-types.md#TypeSpec.Http.ClientCredentialsFlow)
- [`ConflictResponse`](./data-types.md#TypeSpec.Http.ConflictResponse)
- [`CreatedResponse`](./data-types.md#TypeSpec.Http.CreatedResponse)
- [`ForbiddenResponse`](./data-types.md#TypeSpec.Http.ForbiddenResponse)
- [`HeaderOptions`](./data-types.md#TypeSpec.Http.HeaderOptions)
- [`ImplicitFlow`](./data-types.md#TypeSpec.Http.ImplicitFlow)
- [`LocationHeader`](./data-types.md#TypeSpec.Http.LocationHeader)
- [`MovedResponse`](./data-types.md#TypeSpec.Http.MovedResponse)
- [`NoContentResponse`](./data-types.md#TypeSpec.Http.NoContentResponse)
- [`NotFoundResponse`](./data-types.md#TypeSpec.Http.NotFoundResponse)
- [`NotModifiedResponse`](./data-types.md#TypeSpec.Http.NotModifiedResponse)
- [`OAuth2Auth`](./data-types.md#TypeSpec.Http.OAuth2Auth)
- [`OkResponse`](./data-types.md#TypeSpec.Http.OkResponse)
- [`PasswordFlow`](./data-types.md#TypeSpec.Http.PasswordFlow)
- [`PlainData`](./data-types.md#TypeSpec.Http.PlainData)
- [`QueryOptions`](./data-types.md#TypeSpec.Http.QueryOptions)
- [`Response`](./data-types.md#TypeSpec.Http.Response)
- [`UnauthorizedResponse`](./data-types.md#TypeSpec.Http.UnauthorizedResponse)
