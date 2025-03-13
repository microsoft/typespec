import "@typespec/http";
import "@typespec/rest";
import "./models/index.tsp";

using TypeSpec.Http;

@service(#{ title: "Compare It API" })
@server("http://localhost:5000")
@route("/api")
@useAuth(BearerAuth)
namespace CompareItApi {
  @route("/thinggroups")
  namespace ThingGroups {
    @get op getAll(): ThingGroupsResponse;

    @get op get(@path id: int32): ThingGroupResponse;

    @route("/code")
    @get
    op getByCode(@path code: string): ThingGroupResponse;

    @post op create(@body thingGroup: ThingGroup): ThingGroupResponse;

    @put
    op update(@path id: int32, @body thingGroup: ThingGroup): ThingGroupResponse;

    @delete
    op delete(@path id: int32, @body authId: AuthIdBodyRequest): {
      @statusCode statusCode: 204;
    };

    @route("{thingGroupId}/things")
    namespace Things {
      @get
      op getAll(@path thingGroupId: int32): ThingsResponse;

      @get
      op get(@path thingGroupId: int32, @path thingId: int32): ThingResponse;

      @post
      op create(@path thingGroupId: int32, @body thing: Thing): ThingResponse;

      @put
      op update(@path thingGroupId: int32, @path thingId: int32, @body thing: Thing): ThingResponse;

      @delete
      op delete(@path thingGroupId: int32, @path thingId: int32, @body authId: AuthIdBodyRequest): {
        @statusCode statusCode: 204;
      };

      @route("{thingId}/features")
      namespace ThingFeatures {
        @get
        op get(@path thingGroupId: int32, @path thingId: int32): ThingFeatureResponse;

        @post
        op create(
          @path thingGroupId: int32,
          @path thingId: int32,
          @path featureId: int32,
          @body thingFeature: ThingFeature,
        ): ThingFeatureResponse;

        @put
        op update(
          @path thingGroupId: int32,
          @path thingId: int32,
          @path featureId: int32,
          @body thingFeature: ThingFeature,
        ): ThingFeatureResponse;

        @delete
        op delete(
          @path thingGroupId: int32,
          @path thingId: int32,
          @path featureId: int32,
          @body authId: AuthIdBodyRequest,
        ): {
          @statusCode statusCode: 204;
        };
      }
    }

    @route("{thingGroupId}/featuregroups")
    namespace FeatureGroups {
      @get
      op getAll(@path thingGroupId: int32): FeatureGroupsResponse;

      @get
      op get(@path thingGroupId: int32, @path featureGroupId: int32): FeatureGroupResponse;

      @post
      op create(@path thingGroupId: int32, @body featureGroup: FeatureGroup): FeatureGroupResponse;

      @put
      op update(
        @path thingGroupId: int32,
        @path featureGroupId: int32,
        @body featureGroup: FeatureGroup,
      ): FeatureGroupResponse;

      @delete
      op delete(
        @path thingGroupId: int32,
        @path featureGroupId: int32,
        @body authId: AuthIdBodyRequest,
      ): {
        @statusCode statusCode: 204;
      };

      @route("{featureGroupId}/features")
      namespace Features {
        @get
        op get(@path thingGroupId: int32, @path featureGroupId: int32): FeatureResponse;

        @post
        op create(
          @path thingGroupId: int32,
          @path featureGroupId: int32,
          @body feature: Feature,
        ): FeatureResponse;

        @put
        op update(
          @path thingGroupId: int32,
          @path featureGroupId: int32,
          @path featureId: int32,
          @body feature: Feature,
        ): FeatureResponse;

        @delete
        op delete(
          @path thingGroupId: int32,
          @path featureGroupId: int32,
          @path featureId: int32,
          @body authId: AuthIdBodyRequest,
        ): {
          @statusCode statusCode: 204;
        };
      }
    }
  }

  // TODO figure out if we want authId in the body or as a param or not at all and let the service get it.

  @route("/users")
  namespace Users {
    @get
    op getAll(): UsersResponse;

    @post op upsert(@body user: User): UserResponse;
  }

  @route("/comments")
  namespace Comments {
    @post op create(@body request: CommentCreateRequest): CommentResponse;

    @get op get(@path id: int32): CommentResponse;

    @get @route("by-entity") op getByEntity(
      @query type: EntityType,
      @query entityId: int32,
    ): CommentsResponse;

    @delete op delete(@path id: int32): {
      @statusCode statusCode: 204;
    };

    @put op update(@path id: int32, @body comment: Comment): CommentResponse;

    @patch @route("{id}/close") op close(
      @path id: int32,
      @query closingUserId: int32,
    ): CommentResponse;

    @patch @route("{id}/reopen") op reopen(@path id: int32): CommentResponse;

    @post @route("{parentId}/reply") op createReply(
      @path parentId: int32,
      @body comment: Comment,
    ): CommentResponse;
  }
}
