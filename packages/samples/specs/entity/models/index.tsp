using TypeSpec.Http;

namespace CompareItApi {
  model AuthIdBodyRequest {
    authId: string;
  }

  model Comment {
    id: int32;

    @minLength(1)
    content: string;

    createdAt?: utcDateTime;
    isOpen: boolean = true;
    closedAt?: utcDateTime;
    closedByUserId?: int32;
    closedByUser?: User;
    userId: int32;
    user?: User;
    parentId?: int32;
    parent?: Comment;
    replies?: Comment[];
    commentEntities?: CommentEntity[];
  }

  model CommentResponse {
    @statusCode statusCode: 200;
    @body comment: Comment;
  }

  model CommentsResponse {
    @statusCode statusCode: 200;
    @body comments: Comment[];
  }

  model CommentCreateRequest {
    @minLength(1)
    content: string;

    userId: int32;
    entityType: EntityType;
    entityId: int32;
  }

  enum EntityType {
    ThingGroup: "ThingGroup",
    Thing: "Thing",
    FeatureGroup: "FeatureGroup",
    Feature: "Feature",
    ThingFeature: "ThingFeature",
  }

  model CommentEntity {
    id: int32;
    commentId: int32;
    comment: Comment;
    entityId: int32;
    entityType: string;
  }

  model Feature {
    id: int32;

    @minLength(1)
    name: string;

    description: string = "";
    featureGroupId: int32;
    featureGroup?: FeatureGroup;
    featureLinks?: FeatureLink[];
    order: int32;
    ratingWeight: int32;
    thingFeatures?: ThingFeature[];
  }

  model FeaturesResponse {
    @statusCode statusCode: 200;
    @body features: Feature[];
  }

  model FeatureResponse {
    @statusCode statusCode: 200;
    @body feature: Feature;
  }

  model FeatureGroup {
    id: int32;
    description: string = "";
    features?: Feature[];

    @minLength(1)
    name: string;

    order: int32 = 0;
    thingGroupId: int32;
    thingGroup?: ThingGroup;
  }

  model FeatureGroupsResponse {
    @statusCode statusCode: 200;
    @body featureGroups: FeatureGroup[];
  }

  model FeatureGroupResponse {
    @statusCode statusCode: 200;
    @body featureGroup: FeatureGroup;
  }

  model FeatureLink extends LinkEntity {
    featureId: int32;
    feature?: Feature;
  }

  model Link {
    id: int32;
    description: string = "";
    name: string = "";
    type: string = "Website";

    @minLength(1)
    url: string;

    featureLinks?: FeatureLink[];
    thingFeatureLinks?: ThingFeatureLink[];
    thingLinks?: ThingLink[];
  }

  model LinkEntity {
    id: int32;
    linkId: int32;
    link?: Link;
  }

  model Thing {
    id: int32;

    @minLength(1)
    name: string;

    notes: string = "";
    order: int32;
    thingFeatures?: ThingFeature[];
    thingGroupId: int32;
    thingGroup?: ThingGroup;
    thingLinks?: ThingLink[];
  }

  model ThingsResponse {
    @statusCode statusCode: 200;
    @body things: Thing[];
  }

  model ThingResponse {
    @statusCode statusCode: 200;
    @body thing: Thing;
  }

  model ThingFeature {
    id: int32;
    available: boolean;
    commentCount: int32;
    description?: string = "";
    featureId: int32;
    feature?: Feature;
    notes?: string = "";
    rating: int32;
    thingFeatureLinks?: ThingFeatureLink[];
    thingId: int32;
    thing?: Thing;
  }

  model ThingFeaturesResponse {
    @statusCode statusCode: 200;
    @body thingFeatures: ThingFeature[];
  }

  model ThingFeatureResponse {
    @statusCode statusCode: 200;
    @body thingFeature: ThingFeature;
  }

  model ThingFeatureLink extends LinkEntity {
    thingFeatureId: int32;
    thingFeature?: ThingFeature;
  }

  model ThingGroup {
    id: int32;

    @minLength(1)
    code: string;

    description: string = "";
    featureGroups?: FeatureGroup[];
    name: string;
    things?: Thing[];
    userThingGroups?: UserThingGroup[];
    visible: boolean;
  }

  model ThingGroupsResponse {
    @statusCode statusCode: 200;
    @body thingGroups: ThingGroup[];
  }

  model ThingGroupResponse {
    @statusCode statusCode: 200;
    @body thingGroup: ThingGroup;
  }

  model ThingLink extends LinkEntity {
    thingId: int32;
    thing?: Thing;
  }

  model User {
    id: int32;

    @minLength(1)
    authId: string;

    @minLength(1)
    name: string;

    @minLength(1)
    username: string;

    userThingGroups?: UserThingGroup[];
    comments?: Comment[];
  }

  model UsersResponse {
    @statusCode statusCode: 200;
    @body users: User[];
  }

  model UserResponse {
    @statusCode statusCode: 200;
    @body user: User;
  }

  model UserThingGroup {
    id: int32;
    role: string;
    thingGroup?: ThingGroup;
    thingGroupId: int32;
    user?: User;
    userId: int32;
  }
}
