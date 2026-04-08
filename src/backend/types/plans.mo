module {
  /// A PLANS entry (stored without daysCount — calculated at retrieval time)
  public type Plan = {
    dateEntry : Text;      // ISO date string: "YYYY-MM-DD"
    name : Text;
    mobileNumber : Text;   // 10 digits
    installment : Text;
    plan : Text;           // selected from Plan dropdown options
  };

  /// Plan with its auto-assigned ID and calculated daysCount
  public type PlanWithId = {
    id : Nat;
    dateEntry : Text;
    name : Text;
    mobileNumber : Text;
    installment : Text;
    plan : Text;
    daysCount : Nat;       // calculated: days elapsed since dateEntry
  };

  /// Admin aggregate: all plans for a given user
  public type UserPlanData = {
    userMobile : Text;
    plans : [PlanWithId];
  };
};
