import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Types "../types/plans";

module {
  // ─── Day calculation ──────────────────────────────────────────────────────

  /// Parse a "YYYY-MM-DD" string into epoch days (days since 1970-01-01).
  /// Returns 0 on parse failure.
  public func parseDateToDays(dateStr : Text) : Nat {
    let parts = dateStr.split(#char '-').toArray();
    if (parts.size() != 3) return 0;
    let year = switch (Nat.fromText(parts[0])) { case (?n) n; case null return 0 };
    let month = switch (Nat.fromText(parts[1])) { case (?n) n; case null return 0 };
    let day = switch (Nat.fromText(parts[2])) { case (?n) n; case null return 0 };
    if (year < 1970) return 0;
    let y : Nat = year - 1970;
    let leaps = y / 4;
    let yearDays = y * 365 + leaps;
    let monthDays : Nat = switch (month) {
      case 1 0; case 2 31; case 3 59; case 4 90;
      case 5 120; case 6 151; case 7 181; case 8 212;
      case 9 243; case 10 273; case 11 304; case 12 334;
      case _ 0;
    };
    yearDays + monthDays + day;
  };

  /// Calculate daysCount from dateStr (ISO "YYYY-MM-DD") to today.
  public func calcDaysCount(dateStr : Text) : Nat {
    let nowSec : Int = Time.now() / 1_000_000_000;
    let todayDays : Int = nowSec / 86400;
    let today : Nat = if (todayDays < 0) 0 else todayDays.toNat();
    let entryDays = parseDateToDays(dateStr);
    if (today > entryDays) today - entryDays else 0;
  };

  // ─── Per-user helpers ─────────────────────────────────────────────────────

  /// Get (or create) the plan map for a user.
  public func getUserPlanMap(
    userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
    userMobile : Text,
  ) : Map.Map<Text, Types.PlanData> {
    switch (userPlans.get(userMobile)) {
      case (?m) m;
      case null {
        let m = Map.empty<Text, Types.PlanData>();
        userPlans.add(userMobile, m);
        m;
      };
    };
  };

  /// Increment and return the next plan ID for a user.
  public func getNextPlanId(
    userPlanCounters : Map.Map<Text, Nat>,
    userMobile : Text,
  ) : Text {
    let current = switch (userPlanCounters.get(userMobile)) {
      case (?n) n;
      case null 0;
    };
    let nextId = current + 1;
    userPlanCounters.add(userMobile, nextId);
    userMobile # "_p_" # nextId.toText();
  };

  /// Attach id and calculated daysCount to a stored PlanData.
  public func planToWithId(id : Text, p : Types.PlanData) : Types.PlanWithId {
    { id; dateStr = p.dateStr; name = p.name; mobile = p.mobile; installment = p.installment; plan = p.plan; status = p.status; daysCount = calcDaysCount(p.dateStr) };
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  public func addPlan(
    userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
    userPlanCounters : Map.Map<Text, Nat>,
    userMobile : Text,
    planData : Types.PlanData,
  ) : (Text, Types.PlanWithId) {
    let planMap = getUserPlanMap(userPlans, userMobile);
    let id = getNextPlanId(userPlanCounters, userMobile);
    planMap.add(id, planData);
    (id, planToWithId(id, planData));
  };

  public func updatePlan(
    userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
    userMobile : Text,
    id : Text,
    planData : Types.PlanData,
  ) : Bool {
    switch (userPlans.get(userMobile)) {
      case (?planMap) {
        if (not planMap.containsKey(id)) return false;
        planMap.add(id, planData);
        true;
      };
      case null false;
    };
  };

  public func deletePlan(
    userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
    userMobile : Text,
    id : Text,
  ) : Bool {
    switch (userPlans.get(userMobile)) {
      case (?planMap) {
        if (not planMap.containsKey(id)) return false;
        planMap.remove(id);
        true;
      };
      case null false;
    };
  };

  public func getPlan(
    userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
    userMobile : Text,
    id : Text,
  ) : ?Types.PlanWithId {
    switch (userPlans.get(userMobile)) {
      case (?planMap) {
        switch (planMap.get(id)) {
          case (?p) ?planToWithId(id, p);
          case null null;
        };
      };
      case null null;
    };
  };

  public func getAllPlans(
    userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
    userMobile : Text,
  ) : [Types.PlanWithId] {
    switch (userPlans.get(userMobile)) {
      case (?planMap) {
        planMap.entries().map(func((id, p) : (Text, Types.PlanData)) : Types.PlanWithId {
          planToWithId(id, p)
        }).toArray();
      };
      case null [];
    };
  };

  public func getAllPlansForAdmin(
    userPlans : Map.Map<Text, Map.Map<Text, Types.PlanData>>,
  ) : [(Text, [Types.PlanWithId])] {
    userPlans.entries().map(func((mob, planMap) : (Text, Map.Map<Text, Types.PlanData>)) : (Text, [Types.PlanWithId]) {
      let plans = planMap.entries().map(func((id, p) : (Text, Types.PlanData)) : Types.PlanWithId {
        planToWithId(id, p)
      }).toArray();
      (mob, plans);
    }).toArray();
  };
};
