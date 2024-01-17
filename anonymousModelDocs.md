See issue https://github.com/microsoft/typespec/issues/1972

## Typespec Definition
```tsp
interface ResourceOperations<
  InterfaceTraits,
  TErrorResponse = Azure.Core.Foundations.ErrorResponse
> {
  /**
   * Create or replace operation template.
   * @template TResource Resource type.
   * @template Traits Object describing the traits of the operation.
   */
  @createsOrReplacesResource(TResource)
  ResourceCreateOrReplace<
    TResource extends object,
    Traits extends object = {}
  > is Foundations.ResourceOperation<
    TResource,
    Foundations.ResourceBody<TResource> &
      TraitProperties<
        Traits & InterfaceTraits,
        TraitLocation.Parameters,
        TraitContext.Create | TraitContext.Update
      >,
    Foundations.ResourceCreatedOrOkResponse<TResource &
      TraitProperties<
        Traits & InterfaceTraits,
        TraitLocation.Response,
        TraitContext.Create | TraitContext.Update
      >>,
    Traits & InterfaceTraits,
    TErrorResponse
  >;
```

## Current Docs
```
op Azure.Core.ResourceOperations.LongRunningResourceCreateOrReplace(apiVersion: string, resource: TResource): (anonymous model) | (anonymous model) | TErrorResponse
```

The use of anonymous model is not helpful to customers. These three response types come from:

- Operation<...>: Returns `TResponse | TErrorResponse`
- TResponse comes from => Foundations.ResourceCreatedOrOkResponse<TResource &
      TraitProperties<
        Traits & InterfaceTraits,
        TraitLocation.Response,
        TraitContext.Create | TraitContext.Update
      > & Foundations.LongRunningStatusLocation>
- alias ResourceCreatedOrOkResponse<T extends TypeSpec.Reflection.Model> = ResourceCreatedResponse<T> | ResourceOkResponse<T>;
- alias ResourceCreatedResponse<T extends TypeSpec.Reflection.Model> = TypeSpec.Http.Response<201> &
  T;
- alias ResourceOkResponse<T> = TypeSpec.Http.Response<200> & T;

## Possible Docs

#### Use Alias Names
```
op Azure.Core.ResourceOperations.LongRunningResourceCreateOrReplace(apiVersion: string, resource: TResource): 
  ResourceCreatedResponse | ResourceOkResponse |  TErrorResponse
```

This would require us to be able to dig down to see if there is an alias name, which is technically difficult. The question would also be how far to search for aliases? In this case, ResourceCreatedOrOkResponse is the first alias hit, but can be broken into a union of two other aliases. Perhaps the right would be to traverse the tree down to the leave, see if there is a name and if not, begin searching up the tree for the first alias? We would also want to consider whether to expose the definition of "ResourceCreatedResponse" and "ResourceOkResponse" since otherwise customers would be left wondering where those came from. This is all hard to do when processing `progam` since aliases have essentially been erased by that point.
  
This also would not resolve the issue when aliases are not involved, such as when a model is intersected with another model. In that case, we could potentially generate names.

#### Generate Names
  
```tsp
model Foo {
  name: string;
  age: int16;
}

op getFoo(): Foo & LocationHeader
```

Would generate something like:
```md
op getFoo(): Response1;
  
**Anonymous Models**

## Response1

model Foo & LocationHeader
```
  
Or perhaps "getEffectiveModelType" would reveal this just to be Foo, in which case this is really tied to (https://github.com/microsoft/typespec/issues/1971)
  
#### Inline Model
We could replace "(anonymous model)" with the actual model TSP. Conceptually the following TypeSpec should generate the following doc:
  
```tsp
op getFoo(): { name: string; age: int16 }  
```
  
Instead of:
```tsp
op getFoo(): (anonymous model)
```

However, we don't actually render TypeSpec in our reference docs for models, so this would seem strange, and while it may be straightforward in this simple case, it would get complicated fast since we tend to have templates of templates of templates with generous use of intersection.

## Other Issues
  
There are some more fundamental issues that plague our reference docs:
 
1. We have no tests for our docs generation except for ONE test for markdown tables. It seems we should actually have tests set up so that we can say "for this TypeSpec we expect the docs to render like this". This directly contributes to #2.
2. The format of a lot of our reference docs are confusing.
  ![image](https://gist.github.com/assets/5723682/e6377551-a94f-4469-9bec-32e0b833ae56)
We don't list parameters so apiVersion is just... there. Traits is listed as a template parameter, but Traits is never referenced. This is even more pronounced for LongRunningRpcOperation:
  ![image](https://gist.github.com/assets/5723682/6ce89418-54a0-4d42-9e24-887a9ebee97b)
None of these template parameters besides TErrorResponse are referenced! Perhaps this is just a bug in the rendering logic, but if we had tests we would to give deliberate though to how each concept should be rendered. Similarly, models don't actually show their parameters, etc.
