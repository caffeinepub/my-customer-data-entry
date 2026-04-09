import Text "mo:core/Text";
import _Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Migration "migration";

(with migration = Migration.run)
actor {
  // ─── Types ───────────────────────────────────────────────────────────────

  /// Flexible customer data — all fields as key-value pairs
  type CustomerData = {
    fields : [(Text, Text)];
  };

  type CustomerWithId = {
    id : Text;
    fields : [(Text, Text)];
  };

  type DropdownOption = {
    id : Text;
    optionLabel : Text;
    color : Text;
  };

  type Settings = {
    ghRgaOptions : [DropdownOption];
  };

  type TagOption = {
    id : Text;
    optionLabel : Text;
    color : Text;
  };

  type FieldDef = {
    id : Text;
    fieldLabel : Text;
    fieldType : Text;
    required : Bool;
    order : Nat;
  };

  type UserInfo = {
    mobile : Text;
    userName : Text;
  };

  type User = {
    mobile : Text;
    userName : Text;
    createdAt : Int;
  };

  // ─── Plan Types ──────────────────────────────────────────────────────────

  type PlanData = {
    dateStr : Text;
    name : Text;
    mobile : Text;
    installment : Text;
    plan : Text;
    status : Text;
  };

  type PlanWithId = {
    id : Text;
    dateStr : Text;
    name : Text;
    mobile : Text;
    installment : Text;
    plan : Text;
    status : Text;
    daysCount : Nat;
  };

  type PlanOption = {
    id : Text;
    optionLabel : Text;
    color : Text;
  };

  // ─── Constants ───────────────────────────────────────────────────────────

  let _ADMIN_MOBILE : Text = "8128111699";

  // ─── State ───────────────────────────────────────────────────────────────

  // Per-user customer storage: mobile -> (id -> CustomerData)
  let userCustomers = Map.empty<Text, Map.Map<Text, CustomerData>>();

  // Per-user ID counters: mobile -> nextId (Nat, converted to Text when used)
  let userIdCounters = Map.empty<Text, Nat>();

  // OTP store: mobile -> otp
  let otpStore = Map.empty<Text, Text>();

  // Registered users: mobile -> User
  let registeredUsers = Map.empty<Text, User>();

  // Per-user plan storage: mobile -> (id -> PlanData)
  let userPlans = Map.empty<Text, Map.Map<Text, PlanData>>();

  // Per-user plan ID counters
  let userPlanCounters = Map.empty<Text, Nat>();

  // Global plan dropdown options
  let planOptionsList = List.fromArray<PlanOption>([
    { id = "ghs"; optionLabel = "GHS"; color = "green" },
    { id = "rga"; optionLabel = "RGA"; color = "blue" },
  ]);

  // Global GH/RGA dropdown options
  let ghRgaOptions = List.fromArray<DropdownOption>([
    { id = "gh"; optionLabel = "GH"; color = "green" },
    { id = "rga"; optionLabel = "RGA"; color = "blue" },
    { id = "close"; optionLabel = "CLOSE"; color = "red" },
    { id = "not_interested"; optionLabel = "NOT INTERESTED"; color = "gray" },
  ]);

  // Global tag options
  let tagOptionsList = List.fromArray<TagOption>([
    { id = "purple"; optionLabel = "Purple"; color = "purple" },
    { id = "regular"; optionLabel = "Regular"; color = "default" },
  ]);

  // Global field definitions
  let fieldDefsList = List.empty<FieldDef>();

  // Color theme
  var colorTheme = "orange";

  // OTP seed for generation
  var otpSeed : Nat = 100000;

  // ─── Helpers ─────────────────────────────────────────────────────────────

  func getUserCustomerMap(userMobile : Text) : Map.Map<Text, CustomerData> {
    switch (userCustomers.get(userMobile)) {
      case (?m) m;
      case null {
        let m = Map.empty<Text, CustomerData>();
        userCustomers.add(userMobile, m);
        m;
      };
    };
  };

  func getNextCustomerId(userMobile : Text) : Text {
    let current = switch (userIdCounters.get(userMobile)) {
      case (?n) n;
      case null 0;
    };
    let nextId = current + 1;
    userIdCounters.add(userMobile, nextId);
    userMobile # "_c_" # nextId.toText();
  };

  func getUserPlanMap(userMobile : Text) : Map.Map<Text, PlanData> {
    switch (userPlans.get(userMobile)) {
      case (?m) m;
      case null {
        let m = Map.empty<Text, PlanData>();
        userPlans.add(userMobile, m);
        m;
      };
    };
  };

  func getNextPlanId(userMobile : Text) : Text {
    let current = switch (userPlanCounters.get(userMobile)) {
      case (?n) n;
      case null 0;
    };
    let nextId = current + 1;
    userPlanCounters.add(userMobile, nextId);
    userMobile # "_p_" # nextId.toText();
  };

  // ─── Day calculation for PLANS ────────────────────────────────────────────

  func todayDays() : Nat {
    let nowSec : Int = Time.now() / 1_000_000_000;
    let days : Int = nowSec / 86400;
    // Unix epoch is 1970-01-01; no offset needed — just use days from epoch
    if (days < 0) 0 else days.toNat();
  };

  func parseDateToDays(dateStr : Text) : Nat {
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

  func calcDaysCount(dateStr : Text) : Nat {
    let entryDays = parseDateToDays(dateStr);
    let today = todayDays();
    if (today > entryDays) today - entryDays else 0;
  };

  func planToWithId(id : Text, p : PlanData) : PlanWithId {
    { id; dateStr = p.dateStr; name = p.name; mobile = p.mobile; installment = p.installment; plan = p.plan; status = p.status; daysCount = calcDaysCount(p.dateStr) };
  };

  func generateOtpCode() : Text {
    otpSeed := (otpSeed * 1664525 + 1013904223) % 1000000;
    let code = otpSeed;
    if (code < 10) "00000" # code.toText()
    else if (code < 100) "0000" # code.toText()
    else if (code < 1000) "000" # code.toText()
    else if (code < 10000) "00" # code.toText()
    else if (code < 100000) "0" # code.toText()
    else code.toText();
  };

  // ─── OTP / Auth ──────────────────────────────────────────────────────────

  public shared ({ caller = _ }) func generateOtp(mobile : Text) : async Text {
    // Auto-register the admin mobile if not yet present
    if (mobile == _ADMIN_MOBILE and not registeredUsers.containsKey(_ADMIN_MOBILE)) {
      registeredUsers.add(_ADMIN_MOBILE, { mobile = _ADMIN_MOBILE; userName = "Administrator"; createdAt = Time.now() });
    };
    if (not registeredUsers.containsKey(mobile)) {
      return "NOT_REGISTERED";
    };
    let otp = generateOtpCode();
    otpStore.add(mobile, otp);
    otp;
  };

  public shared ({ caller = _ }) func verifyOtp(mobile : Text, otp : Text) : async Bool {
    switch (otpStore.get(mobile)) {
      case (?stored) {
        if (stored == otp) {
          otpStore.remove(mobile);
          true;
        } else false;
      };
      case null false;
    };
  };

  // ─── User Management ─────────────────────────────────────────────────────

  public shared ({ caller = _ }) func createUser(mobile : Text, userName : Text) : async Bool {
    // Ensure admin is auto-created
    if (not registeredUsers.containsKey(_ADMIN_MOBILE)) {
      registeredUsers.add(_ADMIN_MOBILE, { mobile = _ADMIN_MOBILE; userName = "Administrator"; createdAt = Time.now() });
    };
    if (registeredUsers.containsKey(mobile)) {
      return false;
    };
    registeredUsers.add(mobile, { mobile; userName; createdAt = Time.now() });
    true;
  };

  public query ({ caller = _ }) func getUserName(mobile : Text) : async ?Text {
    switch (registeredUsers.get(mobile)) {
      case (?user) ?user.userName;
      case null null;
    };
  };

  public query ({ caller = _ }) func getRegisteredUsers() : async [UserInfo] {
    registeredUsers.values().map(func(u : User) : UserInfo { { mobile = u.mobile; userName = u.userName } }).toArray();
  };

  public shared ({ caller = _ }) func deleteUser(mobile : Text) : async Bool {
    if (mobile == _ADMIN_MOBILE) return false;
    if (not registeredUsers.containsKey(mobile)) return false;
    registeredUsers.remove(mobile);
    true;
  };

  // ─── Customer CRUD (per-user) ─────────────────────────────────────────────

  public shared ({ caller = _ }) func addCustomer(mobile : Text, data : CustomerData) : async Text {
    let userMap = getUserCustomerMap(mobile);
    let id = getNextCustomerId(mobile);
    userMap.add(id, data);
    id;
  };

  public shared ({ caller = _ }) func updateCustomer(mobile : Text, id : Text, data : CustomerData) : async Bool {
    let userMap = getUserCustomerMap(mobile);
    if (not userMap.containsKey(id)) {
      false;
    } else {
      userMap.add(id, data);
      true;
    };
  };

  public shared ({ caller = _ }) func deleteCustomer(mobile : Text, id : Text) : async Bool {
    let userMap = getUserCustomerMap(mobile);
    if (not userMap.containsKey(id)) {
      false;
    } else {
      userMap.remove(id);
      true;
    };
  };

  public query ({ caller = _ }) func getCustomer(mobile : Text, id : Text) : async ?CustomerWithId {
    switch (userCustomers.get(mobile)) {
      case (?userMap) {
        switch (userMap.get(id)) {
          case (?d) ?{ id; fields = d.fields };
          case null null;
        };
      };
      case null null;
    };
  };

  public query ({ caller = _ }) func getAllCustomers(mobile : Text) : async [CustomerWithId] {
    switch (userCustomers.get(mobile)) {
      case (?userMap) {
        userMap.entries().map(func((id, d) : (Text, CustomerData)) : CustomerWithId {
          { id; fields = d.fields }
        }).toArray();
      };
      case null [];
    };
  };

  public query ({ caller = _ }) func getCustomerCount(mobile : Text) : async Nat {
    switch (userCustomers.get(mobile)) {
      case (?userMap) userMap.size();
      case null 0;
    };
  };

  public query ({ caller = _ }) func getAllCustomersForAdmin() : async [(Text, [CustomerWithId])] {
    let result = List.empty<(Text, [CustomerWithId])>();
    userCustomers.forEach(func(mob : Text, userMap : Map.Map<Text, CustomerData>) {
      let withIds = List.empty<CustomerWithId>();
      userMap.forEach(func(id : Text, d : CustomerData) {
        withIds.add({ id; fields = d.fields });
      });
      result.add((mob, withIds.toArray()));
    });
    result.toArray();
  };

  // ─── Settings (GH/RGA) ────────────────────────────────────────────────────

  public query ({ caller = _ }) func getSettings() : async Settings {
    { ghRgaOptions = ghRgaOptions.toArray() };
  };

  public shared ({ caller = _ }) func updateSettings(s : Settings) : async Bool {
    ghRgaOptions.clear();
    for (opt in s.ghRgaOptions.values()) {
      ghRgaOptions.add(opt);
    };
    true;
  };

  // ─── Tag Options ─────────────────────────────────────────────────────────

  public query ({ caller = _ }) func getTagOptions() : async [TagOption] {
    tagOptionsList.toArray();
  };

  public shared ({ caller = _ }) func updateTagOptions(options : [TagOption]) : async Bool {
    tagOptionsList.clear();
    for (opt in options.values()) {
      tagOptionsList.add(opt);
    };
    true;
  };

  // ─── Field Definitions ────────────────────────────────────────────────────

  public query ({ caller = _ }) func getFieldDefinitions() : async [FieldDef] {
    if (fieldDefsList.isEmpty()) {
      [
        { id = "name"; fieldLabel = "Name"; fieldType = "text"; required = true; order = 0 },
        { id = "mobileNo"; fieldLabel = "Mobile No"; fieldType = "text"; required = true; order = 1 },
        { id = "tag"; fieldLabel = "Tag"; fieldType = "text"; required = false; order = 2 },
        { id = "ghRga"; fieldLabel = "GH/RGA"; fieldType = "dropdown"; required = false; order = 3 },
        { id = "address"; fieldLabel = "Address"; fieldType = "text"; required = false; order = 4 },
      ]
    } else {
      fieldDefsList.toArray();
    };
  };

  public shared ({ caller = _ }) func updateFieldDefinitions(fields : [FieldDef]) : async Bool {
    fieldDefsList.clear();
    for (field in fields.values()) {
      fieldDefsList.add(field);
    };
    true;
  };

  // ─── Color Theme ─────────────────────────────────────────────────────────

  public query ({ caller = _ }) func getColorTheme() : async Text {
    colorTheme;
  };

  public shared ({ caller = _ }) func updateColorTheme(theme : Text) : async Bool {
    colorTheme := theme;
    true;
  };

  // ─── Plan CRUD (per-user) ─────────────────────────────────────────────────

  public shared ({ caller = _ }) func addPlan(mobile : Text, plan : PlanData) : async Text {
    let planMap = getUserPlanMap(mobile);
    let id = getNextPlanId(mobile);
    planMap.add(id, plan);
    id;
  };

  public shared ({ caller = _ }) func updatePlan(mobile : Text, id : Text, plan : PlanData) : async Bool {
    let planMap = getUserPlanMap(mobile);
    if (not planMap.containsKey(id)) {
      false;
    } else {
      planMap.add(id, plan);
      true;
    };
  };

  public shared ({ caller = _ }) func deletePlan(mobile : Text, id : Text) : async Bool {
    let planMap = getUserPlanMap(mobile);
    if (not planMap.containsKey(id)) {
      false;
    } else {
      planMap.remove(id);
      true;
    };
  };

  public shared ({ caller = _ }) func deleteAllPlans(mobile : Text) : async Bool {
    switch (userPlans.get(mobile)) {
      case (?planMap) {
        planMap.clear();
        true;
      };
      case null true;
    };
  };

  public shared ({ caller = _ }) func updatePlanStatus(mobile : Text, id : Text, status : Text) : async Bool {
    let planMap = getUserPlanMap(mobile);
    switch (planMap.get(id)) {
      case (?p) {
        planMap.add(id, { p with status });
        true;
      };
      case null false;
    };
  };

  public query ({ caller = _ }) func getPlan(mobile : Text, id : Text) : async ?PlanWithId {
    switch (userPlans.get(mobile)) {
      case (?planMap) {
        switch (planMap.get(id)) {
          case (?p) ?planToWithId(id, p);
          case null null;
        };
      };
      case null null;
    };
  };

  public query ({ caller = _ }) func getAllPlans(mobile : Text) : async [PlanWithId] {
    switch (userPlans.get(mobile)) {
      case (?planMap) {
        planMap.entries().map(func((id, p) : (Text, PlanData)) : PlanWithId {
          planToWithId(id, p)
        }).toArray();
      };
      case null [];
    };
  };

  public query ({ caller = _ }) func getAllPlansForAdmin() : async [(Text, [PlanWithId])] {
    let result = List.empty<(Text, [PlanWithId])>();
    userPlans.forEach(func(mob : Text, planMap : Map.Map<Text, PlanData>) {
      let plans = List.empty<PlanWithId>();
      planMap.forEach(func(id : Text, p : PlanData) {
        plans.add(planToWithId(id, p));
      });
      result.add((mob, plans.toArray()));
    });
    result.toArray();
  };

  // ─── Plan Options ─────────────────────────────────────────────────────────

  public query ({ caller = _ }) func getPlanOptions() : async [PlanOption] {
    planOptionsList.toArray();
  };

  public shared ({ caller = _ }) func updatePlanOptions(options : [PlanOption]) : async Bool {
    planOptionsList.clear();
    for (opt in options.values()) {
      planOptionsList.add(opt);
    };
    true;
  };

};
