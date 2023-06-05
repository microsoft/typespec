import "@typespec/rest";

using TypeSpec.Http;

@error
model ErrorDetails {
  code: int32;
  message: string;
}

model CodeSignAccount {
  name: string;
}

model AccountProfile {
  value: int32;
}

@get
@doc("Reads an instance of the {name} resource.", TResource)
op ResourceReadBase<TResource extends {}, TError>(@path name: string): TResource | TError;
op ResourceRead<TResource extends {}> is ResourceReadBase<TResource, ErrorDetails>;

@post
@doc("Reads an instance of the {name} resource.", TResource)
op ResourceCreateBase<TResource extends {}, TError>(@body resource: TResource): TResource | TError;
op ResourceCreate<TResource extends {}> is ResourceCreateBase<TResource, ErrorDetails>;

@route("codeSignAccounts")
interface CodeSignAccounts {
  get is ResourceRead<CodeSignAccount>;
  create is ResourceCreate<CodeSignAccount>;
}

interface ResourceOperations<TResource extends {}> {
  get is ResourceRead<TResource>;
  create is ResourceCreate<TResource>;
}

@route("accountProfiles")
interface AccountProfiles extends ResourceOperations<AccountProfile> {}
