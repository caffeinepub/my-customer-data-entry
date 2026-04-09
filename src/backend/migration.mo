import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {
  // ─── Old types (from .old/src/backend/main.mo) ────────────────────────────

  type OldCustomField = {
    fieldName : Text;
    fieldValue : Text;
  };

  type OldCustomer = {
    name : Text;
    mobileNumber : Text;
    tag : Text;
    ghRga : Text;
    address : Text;
    isHighlighted : Bool;
    customFields : [OldCustomField];
  };

  type OldTagOption = {
    tagLabel : Text;
    tagColor : Text;
  };

  type OldFieldDefinition = {
    id : Text;
    fieldLabel : Text;
    fieldType : Text;
    order : Nat;
  };

  type OldPlan = {
    dateEntry : Text;
    name : Text;
    mobileNumber : Text;
    installment : Text;
    plan : Text;
    billRefundStatus : Text;
  };

  type OldUser = {
    mobile : Text;
    userName : Text;
    createdAt : Int;
  };

  // ─── New types (aligned with new main.mo) ────────────────────────────────

  type NewCustomerData = {
    fields : [(Text, Text)];
  };

  type NewPlanData = {
    dateStr : Text;
    name : Text;
    mobile : Text;
    installment : Text;
    plan : Text;
    status : Text;
  };

  type NewDropdownOption = {
    id : Text;
    optionLabel : Text;
    color : Text;
  };

  type NewTagOption = {
    id : Text;
    optionLabel : Text;
    color : Text;
  };

  type NewFieldDef = {
    id : Text;
    fieldLabel : Text;
    fieldType : Text;
    required : Bool;
    order : Nat;
  };

  type NewPlanOption = {
    id : Text;
    optionLabel : Text;
    color : Text;
  };

  type NewUser = {
    mobile : Text;
    userName : Text;
    createdAt : Int;
  };

  // ─── Migration input (old stable state) ──────────────────────────────────

  type OldActor = {
    userCustomers : Map.Map<Text, Map.Map<Nat, OldCustomer>>;
    userIdCounters : Map.Map<Text, Nat>;
    otpStore : Map.Map<Text, Text>;
    registeredUsers : Map.Map<Text, OldUser>;
    legacyCustomers : Map.Map<Nat, OldCustomer>;
    legacyIdCounter : Nat;
    var legacyMigrated : Bool;
    userPlans : Map.Map<Text, Map.Map<Nat, OldPlan>>;
    userPlanCounters : Map.Map<Text, Nat>;
    planOptions : List.List<Text>;
    settings : List.List<Text>;
    tagOptions : List.List<OldTagOption>;
    fieldDefinitions : List.List<OldFieldDefinition>;
    var colorTheme : Text;
    var otpSeed : Nat;
  };

  // ─── Migration output (new stable state) ─────────────────────────────────

  type NewActor = {
    userCustomers : Map.Map<Text, Map.Map<Text, NewCustomerData>>;
    userIdCounters : Map.Map<Text, Nat>;
    otpStore : Map.Map<Text, Text>;
    registeredUsers : Map.Map<Text, NewUser>;
    userPlans : Map.Map<Text, Map.Map<Text, NewPlanData>>;
    userPlanCounters : Map.Map<Text, Nat>;
    planOptionsList : List.List<NewPlanOption>;
    ghRgaOptions : List.List<NewDropdownOption>;
    tagOptionsList : List.List<NewTagOption>;
    fieldDefsList : List.List<NewFieldDef>;
    var colorTheme : Text;
    var otpSeed : Nat;
  };

  // ─── Conversion helpers ───────────────────────────────────────────────────

  func convertCustomer(c : OldCustomer) : NewCustomerData {
    let fields = List.empty<(Text, Text)>();
    fields.add(("name", c.name));
    fields.add(("mobileNo", c.mobileNumber));
    fields.add(("tag", c.tag));
    fields.add(("ghRga", c.ghRga));
    fields.add(("address", c.address));
    // Add any custom fields
    for (cf in c.customFields.values()) {
      fields.add((cf.fieldName, cf.fieldValue));
    };
    { fields = fields.toArray() };
  };

  func convertPlan(p : OldPlan) : NewPlanData {
    {
      dateStr = p.dateEntry;
      name = p.name;
      mobile = p.mobileNumber;
      installment = p.installment;
      plan = p.plan;
      status = p.billRefundStatus;
    };
  };

  // ─── Main migration function ──────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Convert userCustomers: Map<Text, Map<Nat, OldCustomer>> -> Map<Text, Map<Text, NewCustomerData>>
    let newUserCustomers = Map.empty<Text, Map.Map<Text, NewCustomerData>>();
    old.userCustomers.forEach(func(mobile : Text, oldUserMap : Map.Map<Nat, OldCustomer>) {
      let newMap = Map.empty<Text, NewCustomerData>();
      oldUserMap.forEach(func(id : Nat, c : OldCustomer) {
        let textId = mobile # "_c_" # id.toText();
        newMap.add(textId, convertCustomer(c));
      });
      newUserCustomers.add(mobile, newMap);
    });

    // Also migrate legacy customers if any
    if (not old.legacyCustomers.isEmpty()) {
      let legacyMap = Map.empty<Text, NewCustomerData>();
      old.legacyCustomers.forEach(func(id : Nat, c : OldCustomer) {
        let textId = "legacy_c_" # id.toText();
        legacyMap.add(textId, convertCustomer(c));
      });
      newUserCustomers.add("legacy", legacyMap);
    };

    // Convert userPlans: Map<Text, Map<Nat, OldPlan>> -> Map<Text, Map<Text, NewPlanData>>
    let newUserPlans = Map.empty<Text, Map.Map<Text, NewPlanData>>();
    old.userPlans.forEach(func(mobile : Text, oldPlanMap : Map.Map<Nat, OldPlan>) {
      let newMap = Map.empty<Text, NewPlanData>();
      oldPlanMap.forEach(func(id : Nat, p : OldPlan) {
        let textId = mobile # "_p_" # id.toText();
        newMap.add(textId, convertPlan(p));
      });
      newUserPlans.add(mobile, newMap);
    });

    // Preserve registered users
    let newRegisteredUsers = Map.empty<Text, NewUser>();
    old.registeredUsers.forEach(func(mobile : Text, u : OldUser) {
      newRegisteredUsers.add(mobile, { mobile = u.mobile; userName = u.userName; createdAt = u.createdAt });
    });

    // Convert old plan options (Text) to new PlanOption records
    let newPlanOptions = List.empty<NewPlanOption>();
    var planIdx : Nat = 0;
    old.planOptions.forEach(func(optText : Text) {
      newPlanOptions.add({ id = "plan_" # planIdx.toText(); optionLabel = optText; color = "blue" });
      planIdx += 1;
    });
    // Ensure at least default options
    if (newPlanOptions.isEmpty()) {
      newPlanOptions.add({ id = "ghs"; optionLabel = "GHS"; color = "green" });
      newPlanOptions.add({ id = "rga"; optionLabel = "RGA"; color = "blue" });
    };

    // Convert old GH/RGA settings (Text) to DropdownOption
    let newGhRgaOptions = List.empty<NewDropdownOption>();
    var ghIdx : Nat = 0;
    old.settings.forEach(func(s : Text) {
      newGhRgaOptions.add({ id = "gh_" # ghIdx.toText(); optionLabel = s; color = "blue" });
      ghIdx += 1;
    });
    if (newGhRgaOptions.isEmpty()) {
      newGhRgaOptions.add({ id = "gh"; optionLabel = "GH"; color = "green" });
      newGhRgaOptions.add({ id = "rga"; optionLabel = "RGA"; color = "blue" });
    };

    // Convert old tag options
    let newTagOptions = List.empty<NewTagOption>();
    var tagIdx : Nat = 0;
    old.tagOptions.forEach(func(t : OldTagOption) {
      newTagOptions.add({ id = "tag_" # tagIdx.toText(); optionLabel = t.tagLabel; color = t.tagColor });
      tagIdx += 1;
    });
    if (newTagOptions.isEmpty()) {
      newTagOptions.add({ id = "purple"; optionLabel = "Purple"; color = "purple" });
      newTagOptions.add({ id = "regular"; optionLabel = "Regular"; color = "default" });
    };

    // Convert old field definitions
    let newFieldDefs = List.empty<NewFieldDef>();
    old.fieldDefinitions.forEach(func(f : OldFieldDefinition) {
      newFieldDefs.add({ id = f.id; fieldLabel = f.fieldLabel; fieldType = f.fieldType; required = false; order = f.order });
    });

    {
      userCustomers = newUserCustomers;
      userIdCounters = old.userIdCounters;
      otpStore = old.otpStore;
      registeredUsers = newRegisteredUsers;
      userPlans = newUserPlans;
      userPlanCounters = old.userPlanCounters;
      planOptionsList = newPlanOptions;
      ghRgaOptions = newGhRgaOptions;
      tagOptionsList = newTagOptions;
      fieldDefsList = newFieldDefs;
      var colorTheme = old.colorTheme;
      var otpSeed = old.otpSeed;
    };
  };
};
