import "@typespec/json-schema";
using JsonSchema;

@JsonSchema
namespace Example;

@id("user")
model User {
  @format("uuid")
  id: string;

  @minLength(2)
  @maxLength(20)
  username: string;

  @format("email")
  email: string;
  posts: Page<Post>;
}

@id("postUnion")
union Post {
  blog: BlogPost,
  link: LinkPost,
}

model Page<T> {
  @format("uri-reference")
  nextLink?: string;
  items: T[];
}

model PostBase {
  author: User.id;
  postedAt: zonedDateTime;
  updatedAt?: zonedDateTime;
}

model BlogPost extends PostBase {
  @minLength(20)
  @maxLength(2000)
  content: string;
}

model LinkPost extends PostBase {
  link: url;
  title?: string;
}
