import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/plans";
import PlansLib "../lib/plans";

/// Public API mixin for the PLANS domain.
/// Inject per-user plan state and global plan options via mixin parameters.
mixin (
  userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
  userPlanCounters : Map.Map<Text, Nat>,
  planOptionsList : [Types.PlanOption],
) {
  // ─── CRUD ─────────────────────────────────────────────────────────────────

  public shared ({ caller = _ }) func addPlan(mobile : Text, plan : Types.PlanData) : async Text {
    let (id, _) = PlansLib.addPlan(userPlans, userPlanCounters, mobile, plan);
    id;
  };

  public shared ({ caller = _ }) func updatePlan(mobile : Text, id : Text, plan : Types.PlanData) : async Bool {
    PlansLib.updatePlan(userPlans, mobile, id, plan);
  };

  public shared ({ caller = _ }) func deletePlan(mobile : Text, id : Text) : async Bool {
    PlansLib.deletePlan(userPlans, mobile, id);
  };

  public query ({ caller = _ }) func getPlan(mobile : Text, id : Text) : async ?Types.PlanWithId {
    PlansLib.getPlan(userPlans, mobile, id);
  };

  public query ({ caller = _ }) func getAllPlans(mobile : Text) : async [Types.PlanWithId] {
    PlansLib.getAllPlans(userPlans, mobile);
  };

  // ─── Admin ────────────────────────────────────────────────────────────────

  public query ({ caller = _ }) func getAllPlansForAdmin() : async [(Text, [Types.PlanWithId])] {
    PlansLib.getAllPlansForAdmin(userPlans);
  };

  // ─── Plan dropdown options ────────────────────────────────────────────────

  public query ({ caller = _ }) func getPlanOptions() : async [Types.PlanOption] {
    planOptionsList;
  };
};
