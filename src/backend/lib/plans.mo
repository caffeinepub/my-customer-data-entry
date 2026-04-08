import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Types "../types/plans";

module {
  // ─── Day calculation ──────────────────────────────────────────────────────

  /// Parse a "YYYY-MM-DD" string into epoch days (days since 1970-01-01).
  /// Returns 0 on parse failure.
  public func parseDateToDays(dateStr : Text) : Nat {
    Runtime.trap("not implemented");
  };

  /// Calculate daysCount from dateEntry (ISO "YYYY-MM-DD") to today.
  public func calcDaysCount(dateEntry : Text) : Nat {
    Runtime.trap("not implemented");
  };

  // ─── Per-user helpers ─────────────────────────────────────────────────────

  /// Get (or create) the plan map for a user.
  public func getUserPlanMap(
    userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
    userMobile : Text,
  ) : Map.Map<Nat, Types.Plan> {
    Runtime.trap("not implemented");
  };

  /// Increment and return the next plan ID for a user.
  public func getNextPlanId(
    userPlanCounters : Map.Map<Text, Nat>,
    userMobile : Text,
  ) : Nat {
    Runtime.trap("not implemented");
  };

  /// Attach id and calculated daysCount to a stored Plan.
  public func planToWithId(id : Nat, p : Types.Plan) : Types.PlanWithId {
    Runtime.trap("not implemented");
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  public func addPlan(
    userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
    userPlanCounters : Map.Map<Text, Nat>,
    userMobile : Text,
    planData : Types.Plan,
  ) : Types.PlanWithId {
    Runtime.trap("not implemented");
  };

  public func updatePlan(
    userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
    userMobile : Text,
    id : Nat,
    planData : Types.Plan,
  ) : Bool {
    Runtime.trap("not implemented");
  };

  public func deletePlan(
    userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
    userMobile : Text,
    id : Nat,
  ) : Bool {
    Runtime.trap("not implemented");
  };

  public func getPlan(
    userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
    userMobile : Text,
    id : Nat,
  ) : ?Types.PlanWithId {
    Runtime.trap("not implemented");
  };

  public func getAllPlans(
    userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
    userMobile : Text,
  ) : [Types.PlanWithId] {
    Runtime.trap("not implemented");
  };

  public func getAllPlansForAdmin(
    userPlans : Map.Map<Text, Map.Map<Nat, Types.Plan>>,
  ) : [Types.UserPlanData] {
    Runtime.trap("not implemented");
  };

  // ─── Plan options (global dropdown) ──────────────────────────────────────

  public func getPlanOptions(planOptions : List.List<Text>) : [Text] {
    Runtime.trap("not implemented");
  };

  public func updatePlanOptions(planOptions : List.List<Text>, newOptions : [Text]) {
    Runtime.trap("not implemented");
  };
};
