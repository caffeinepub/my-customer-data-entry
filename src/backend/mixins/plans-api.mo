import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Types "../types/plans";
import PlansLib "../lib/plans";

/// Public API mixin for the PLANS domain.
/// Inject per-user plan state and global plan options via mixin parameters.
mixin (
  userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
  userPlanCounters : Map.Map<Text, Nat>,
  planOptions : List.List<Text>,
) {
  // ─── CRUD ─────────────────────────────────────────────────────────────────

  public shared ({ caller = _ }) func addPlan(userMobile : Text, planData : Types.Plan) : async Types.PlanWithId {
    Runtime.trap("not implemented");
  };

  public shared ({ caller = _ }) func updatePlan(userMobile : Text, id : Nat, planData : Types.Plan) : async Bool {
    Runtime.trap("not implemented");
  };

  public shared ({ caller = _ }) func deletePlan(userMobile : Text, id : Nat) : async Bool {
    Runtime.trap("not implemented");
  };

  public query ({ caller = _ }) func getPlan(userMobile : Text, id : Nat) : async ?Types.PlanWithId {
    Runtime.trap("not implemented");
  };

  public query ({ caller = _ }) func getAllPlans(userMobile : Text) : async [Types.PlanWithId] {
    Runtime.trap("not implemented");
  };

  // ─── Admin ────────────────────────────────────────────────────────────────

  public query ({ caller = _ }) func getAllPlansForAdmin() : async [Types.UserPlanData] {
    Runtime.trap("not implemented");
  };

  // ─── Plan dropdown options ────────────────────────────────────────────────

  public query ({ caller = _ }) func getPlanOptions() : async [Text] {
    Runtime.trap("not implemented");
  };

  public shared ({ caller = _ }) func updatePlanOptions(newOptions : [Text]) : async () {
    Runtime.trap("not implemented");
  };
};
