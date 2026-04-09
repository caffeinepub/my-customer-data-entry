module {
  /// A PLANS entry (stored without daysCount — calculated at retrieval time)
  public type PlanData = {
    dateStr : Text;        // ISO date string: "YYYY-MM-DD"
    name : Text;
    mobile : Text;         // 10 digits
    installment : Text;
    plan : Text;           // selected from Plan dropdown options
    status : Text;         // "" | "BILL_DONE" | "REFUND"
  };

  /// Plan with its auto-assigned Text ID and calculated daysCount
  public type PlanWithId = {
    id : Text;
    dateStr : Text;
    name : Text;
    mobile : Text;
    installment : Text;
    plan : Text;
    status : Text;
    daysCount : Nat;       // calculated: days elapsed since dateStr
  };

  /// Plan dropdown option
  public type PlanOption = {
    id : Text;
    label : Text;
    color : Text;
  };
};
