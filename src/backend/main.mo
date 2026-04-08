import Text "mo:core/Text";
import Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";



actor {
  // ─── Types ───────────────────────────────────────────────────────────────

  type CustomField = {
    fieldName : Text;
    fieldValue : Text;
  };

  type Customer = {
    name : Text;
    mobileNumber : Text;
    tag : Text;
    ghRga : Text;
    address : Text;
    isHighlighted : Bool;
    customFields : [CustomField];
  };

  type CustomerWithId = {
    id : Nat;
    name : Text;
    mobileNumber : Text;
    tag : Text;
    ghRga : Text;
    address : Text;
    isHighlighted : Bool;
    customFields : [CustomField];
  };

  type TagOption = {
    tagLabel : Text;
    tagColor : Text;
  };

  type FieldDefinition = {
    id : Text;
    fieldLabel : Text;
    fieldType : Text;
    order : Nat;
  };

  type UserCustomerData = {
    userMobile : Text;
    customers : [CustomerWithId];
  };

  // ─── Plan Types ──────────────────────────────────────────────────────────

  type Plan = {
    dateEntry : Text;
    name : Text;
    mobileNumber : Text;
    installment : Text;
    plan : Text;
    billRefundStatus : Text;
  };

  type PlanWithId = {
    id : Nat;
    dateEntry : Text;
    name : Text;
    mobileNumber : Text;
    installment : Text;
    plan : Text;
    daysCount : Nat;
    billRefundStatus : Text;
  };

  type UserPlanData = {
    userMobile : Text;
    plans : [PlanWithId];
  };

  // ─── User Registry ────────────────────────────────────────────────────────

  type User = {
    mobile : Text;
    userName : Text;
    createdAt : Int;
  };

  // ─── Constants ───────────────────────────────────────────────────────────

  let _ADMIN_MOBILE : Text = "8128111699";

  // ─── State ───────────────────────────────────────────────────────────────

  // Per-user customer storage: mobile -> (id -> Customer)
  let userCustomers = Map.empty<Text, Map.Map<Nat, Customer>>();

  // Per-user ID counters: mobile -> nextId
  let userIdCounters = Map.empty<Text, Nat>();

  // OTP store: mobile -> otp
  let otpStore = Map.empty<Text, Text>();

  // Registered users: mobile -> User
  let registeredUsers = Map.empty<Text, User>();

  // Legacy flat customer storage (migrated on first call)
  let legacyCustomers = Map.empty<Nat, Customer>();
  let legacyIdCounter = 0;
  var legacyMigrated = false;

  // Per-user plan storage: mobile -> (id -> Plan)
  let userPlans = Map.empty<Text, Map.Map<Nat, Plan>>();

  // Per-user plan ID counters: mobile -> nextId
  let userPlanCounters = Map.empty<Text, Nat>();

  // Global plan dropdown options
  let planOptions = List.fromArray(["GHS", "RGA"]);

  // Global settings
  let settings = List.fromArray(["GH", "RGA", "CLOSE", "NOT INTERESTED"]);
  let tagOptions = List.fromArray<TagOption>([
    { tagLabel = "Purple"; tagColor = "purple" },
    { tagLabel = "Regular"; tagColor = "default" },
  ]);
  let fieldDefinitions = List.empty<FieldDefinition>();
  var colorTheme = "orange";

  // ─── Helpers ─────────────────────────────────────────────────────────────

  func getUserMap(userMobile : Text) : Map.Map<Nat, Customer> {
    switch (userCustomers.get(userMobile)) {
      case (?m) m;
      case null {
        let m = Map.empty<Nat, Customer>();
        userCustomers.add(userMobile, m);
        m;
      };
    };
  };

  func getNextId(userMobile : Text) : Nat {
    let current = switch (userIdCounters.get(userMobile)) {
      case (?n) n;
      case null 0;
    };
    userIdCounters.add(userMobile, current + 1);
    current;
  };

  func customerToWithId(id : Nat, c : Customer) : CustomerWithId {
    { id; name = c.name; mobileNumber = c.mobileNumber; tag = c.tag; ghRga = c.ghRga; address = c.address; isHighlighted = c.isHighlighted; customFields = c.customFields };
  };

  func compareCustomerWithId(c1 : CustomerWithId, c2 : CustomerWithId) : Order.Order {
    Text.compare(c1.name, c2.name);
  };

  // Migrate any legacy flat customers to the "legacy" user slot
  func ensureLegacyMigrated() {
    if (not legacyMigrated) {
      if (not legacyCustomers.isEmpty()) {
        let legacyMap = getUserMap("legacy");
        legacyCustomers.forEach(func(id, c) {
          legacyMap.add(id, c);
        });
        switch (userIdCounters.get("legacy")) {
          case null { userIdCounters.add("legacy", legacyIdCounter) };
          case _ {};
        };
      };
      legacyMigrated := true;
    };
  };

  // Simple deterministic OTP derivation — returns 6-digit code
  // We XOR the mobile digits together with a counter seed for variety
  var otpSeed : Nat = 100000;

  func generateOtpCode() : Text {
    otpSeed := (otpSeed * 1664525 + 1013904223) % 1000000;
    let code = otpSeed;
    // Pad to 6 digits
    if (code < 10) "00000" # code.toText()
    else if (code < 100) "0000" # code.toText()
    else if (code < 1000) "000" # code.toText()
    else if (code < 10000) "00" # code.toText()
    else if (code < 100000) "0" # code.toText()
    else code.toText();
  };

  // ─── OTP / Auth ──────────────────────────────────────────────────────────

  // Generates a 6-digit OTP for the mobile, stores it, and returns it
  // so the frontend can display it to the user.
  // Only registered users (and the admin) can request an OTP.
  // Returns "NOT_REGISTERED" if the mobile is not registered and is not admin.
  public shared ({ caller = _ }) func generateOtp(mobile : Text) : async Text {
    // Auto-register the admin mobile if not yet present
    if (mobile == _ADMIN_MOBILE and not registeredUsers.containsKey(_ADMIN_MOBILE)) {
      registeredUsers.add(_ADMIN_MOBILE, { mobile = _ADMIN_MOBILE; userName = "Administrator"; createdAt = Time.now() });
    };
    // Block non-registered, non-admin mobiles
    if (not registeredUsers.containsKey(mobile)) {
      return "NOT_REGISTERED";
    };
    let otp = generateOtpCode();
    otpStore.add(mobile, otp);
    otp;
  };

  // Verifies the OTP; removes it after first successful use
  public shared ({ caller = _ }) func verifyOtp(mobile : Text, otp : Text) : async Bool {
    switch (otpStore.get(mobile)) {
      case (?stored) {
        if (stored == otp) {
          otpStore.remove(mobile);
          true;
        } else {
          false;
        };
      };
      case null false;
    };
  };

  // ─── Customer CRUD (per-user) ─────────────────────────────────────────────

  public shared ({ caller = _ }) func addCustomer(userMobile : Text, customer : Customer) : async Nat {
    ensureLegacyMigrated();
    let userMap = getUserMap(userMobile);
    let id = getNextId(userMobile);
    userMap.add(id, customer);
    id;
  };

  public shared ({ caller = _ }) func updateCustomer(userMobile : Text, id : Nat, customer : Customer) : async Bool {
    ensureLegacyMigrated();
    let userMap = getUserMap(userMobile);
    if (not userMap.containsKey(id)) {
      false;
    } else {
      userMap.add(id, customer);
      true;
    };
  };

  public shared ({ caller = _ }) func deleteCustomer(userMobile : Text, id : Nat) : async Bool {
    ensureLegacyMigrated();
    let userMap = getUserMap(userMobile);
    if (not userMap.containsKey(id)) {
      false;
    } else {
      userMap.remove(id);
      true;
    };
  };

  public query ({ caller = _ }) func getCustomer(userMobile : Text, id : Nat) : async ?CustomerWithId {
    switch (userCustomers.get(userMobile)) {
      case (?userMap) {
        switch (userMap.get(id)) {
          case (?c) ?customerToWithId(id, c);
          case null null;
        };
      };
      case null null;
    };
  };

  public query ({ caller = _ }) func getAllCustomers(userMobile : Text) : async [CustomerWithId] {
    switch (userCustomers.get(userMobile)) {
      case (?userMap) {
        let withIds = userMap.entries().map(func((id, c) : (Nat, Customer)) : CustomerWithId {
          customerToWithId(id, c)
        }).toArray();
        withIds.sort(compareCustomerWithId);
      };
      case null [];
    };
  };

  // ─── Admin Methods ────────────────────────────────────────────────────────

  // Returns all mobile numbers that have any customers
  public query ({ caller = _ }) func getAllUsers() : async [Text] {
    userCustomers.keys().toArray();
  };

  // Returns the customer count for a given user
  public query ({ caller = _ }) func getCustomerCount(userMobile : Text) : async Nat {
    switch (userCustomers.get(userMobile)) {
      case (?userMap) userMap.size();
      case null 0;
    };
  };

  // Returns all users with all their customers (admin use)
  public query ({ caller = _ }) func getAllCustomersForAdmin() : async [UserCustomerData] {
    userCustomers.entries().map(func((mobile, userMap) : (Text, Map.Map<Nat, Customer>)) : UserCustomerData {
      let withIds = userMap.entries().map(func((id, c) : (Nat, Customer)) : CustomerWithId {
        customerToWithId(id, c)
      }).toArray();
      { userMobile = mobile; customers = withIds.sort(compareCustomerWithId) };
    }).toArray();
  };

  // ─── User Management ─────────────────────────────────────────────────────

  // Admin-only: create a new registered user
  public shared ({ caller = _ }) func createUser(adminMobile : Text, newMobile : Text, userName : Text) : async { ok : Bool; message : Text } {
    if (adminMobile != _ADMIN_MOBILE) {
      return { ok = false; message = "Only admin can create users" };
    };
    if (registeredUsers.containsKey(newMobile)) {
      return { ok = false; message = "Mobile number already registered" };
    };
    registeredUsers.add(newMobile, { mobile = newMobile; userName; createdAt = Time.now() });
    { ok = true; message = "User created successfully" };
  };

  // Returns the user's name, or their mobile number as fallback
  public query ({ caller = _ }) func getUserName(mobile : Text) : async Text {
    switch (registeredUsers.get(mobile)) {
      case (?user) user.userName;
      case null mobile;
    };
  };

  // Admin-only: list all registered users with names
  public query ({ caller = _ }) func getRegisteredUsers(adminMobile : Text) : async [User] {
    if (adminMobile != _ADMIN_MOBILE) {
      return [];
    };
    registeredUsers.values().toArray();
  };

  // Admin-only: delete a user (cannot delete the admin account)
  public shared ({ caller = _ }) func deleteUser(adminMobile : Text, mobile : Text) : async { ok : Bool; message : Text } {
    if (adminMobile != _ADMIN_MOBILE) {
      return { ok = false; message = "Only admin can delete users" };
    };
    if (mobile == _ADMIN_MOBILE) {
      return { ok = false; message = "Cannot delete admin account" };
    };
    registeredUsers.remove(mobile);
    { ok = true; message = "User deleted successfully" };
  };

  // ─── Settings (GH/RGA) ────────────────────────────────────────────────────

  public shared ({ caller = _ }) func updateSettings(newSettings : [Text]) : async () {
    settings.clear();
    for (setting in newSettings.values()) {
      settings.add(setting);
    };
  };

  public query ({ caller = _ }) func getSettings() : async [Text] {
    settings.toArray();
  };

  // ─── Tag Options ─────────────────────────────────────────────────────────

  public shared ({ caller = _ }) func updateTagOptions(newOptions : [TagOption]) : async () {
    tagOptions.clear();
    for (opt in newOptions.values()) {
      tagOptions.add(opt);
    };
  };

  public query ({ caller = _ }) func getTagOptions() : async [TagOption] {
    tagOptions.toArray();
  };

  // ─── Field Definitions ────────────────────────────────────────────────────

  public query ({ caller = _ }) func getFieldDefinitions() : async [FieldDefinition] {
    if (fieldDefinitions.isEmpty()) {
      [
        { id = "name"; fieldLabel = "Name"; fieldType = "text"; order = 0 },
        { id = "mobileNo"; fieldLabel = "Mobile No"; fieldType = "text"; order = 1 },
        { id = "tag"; fieldLabel = "Tag"; fieldType = "text"; order = 2 },
        { id = "ghRga"; fieldLabel = "GH/RGA"; fieldType = "text"; order = 3 },
        { id = "address"; fieldLabel = "Address"; fieldType = "text"; order = 4 },
      ]
    } else {
      fieldDefinitions.toArray();
    };
  };

  public shared ({ caller = _ }) func updateFieldDefinitions(fields : [FieldDefinition]) : async () {
    fieldDefinitions.clear();
    for (field in fields.values()) {
      fieldDefinitions.add(field);
    };
  };

  // ─── Color Theme ─────────────────────────────────────────────────────────

  public query ({ caller = _ }) func getColorTheme() : async Text {
    colorTheme;
  };

  public shared ({ caller = _ }) func updateColorTheme(theme : Text) : async () {
    colorTheme := theme;
  };

  // ─── Plan Helpers ─────────────────────────────────────────────────────────

  // Returns today's day count since a fixed epoch (days since 2000-01-01)
  // Uses simple integer arithmetic approximation
  func todayDays() : Nat {
    let nowSec : Int = Time.now() / 1_000_000_000;
    let days : Int = nowSec / 86400;
    // Unix epoch days to 2000-01-01: 10957 days
    let sinceEpoch : Int = days - 10957;
    if (sinceEpoch < 0) 0 else sinceEpoch.toNat();
  };

  // Parse "YYYY-MM-DD" and return days since 2000-01-01 (approximation)
  // Uses: year*365 + leapYears + monthDays + day
  func parseDateToDays(dateStr : Text) : Nat {
    let parts = dateStr.split(#char '-').toArray();
    if (parts.size() != 3) return 0;
    let year = switch (Nat.fromText(parts[0])) { case (?n) n; case null return 0 };
    let month = switch (Nat.fromText(parts[1])) { case (?n) n; case null return 0 };
    let day = switch (Nat.fromText(parts[2])) { case (?n) n; case null return 0 };
    if (year < 2000) return 0;
    let y : Nat = year - 2000;
    // Days from year offset (365*y + approx leap years)
    let leaps = y / 4;
    let yearDays = y * 365 + leaps;
    // Days from months (non-leap approximation)
    let monthDays : Nat = switch (month) {
      case 1 0; case 2 31; case 3 59; case 4 90;
      case 5 120; case 6 151; case 7 181; case 8 212;
      case 9 243; case 10 273; case 11 304; case 12 334;
      case _ 0;
    };
    yearDays + monthDays + day;
  };

  func calcDaysCount(dateEntry : Text) : Nat {
    let entryDays = parseDateToDays(dateEntry);
    let today = todayDays();
    if (today > entryDays) today - entryDays else 0;
  };

  func getUserPlanMap(userMobile : Text) : Map.Map<Nat, Plan> {
    switch (userPlans.get(userMobile)) {
      case (?m) m;
      case null {
        let m = Map.empty<Nat, Plan>();
        userPlans.add(userMobile, m);
        m;
      };
    };
  };

  func getNextPlanId(userMobile : Text) : Nat {
    let current = switch (userPlanCounters.get(userMobile)) {
      case (?n) n;
      case null 0;
    };
    userPlanCounters.add(userMobile, current + 1);
    current;
  };

  func planToWithId(id : Nat, p : Plan) : PlanWithId {
    { id; dateEntry = p.dateEntry; name = p.name; mobileNumber = p.mobileNumber; installment = p.installment; plan = p.plan; daysCount = calcDaysCount(p.dateEntry); billRefundStatus = p.billRefundStatus };
  };

  // ─── Plan CRUD ────────────────────────────────────────────────────────────

  public shared ({ caller = _ }) func addPlan(userMobile : Text, planData : Plan) : async PlanWithId {
    let planMap = getUserPlanMap(userMobile);
    let id = getNextPlanId(userMobile);
    planMap.add(id, planData);
    planToWithId(id, planData);
  };

  public shared ({ caller = _ }) func updatePlan(userMobile : Text, id : Nat, planData : Plan) : async Bool {
    let planMap = getUserPlanMap(userMobile);
    if (not planMap.containsKey(id)) {
      false;
    } else {
      planMap.add(id, planData);
      true;
    };
  };

  public shared ({ caller = _ }) func deletePlan(userMobile : Text, id : Nat) : async Bool {
    let planMap = getUserPlanMap(userMobile);
    if (not planMap.containsKey(id)) {
      false;
    } else {
      planMap.remove(id);
      true;
    };
  };

  public shared ({ caller = _ }) func updatePlanStatus(userMobile : Text, id : Nat, status : Text) : async Bool {
    let planMap = getUserPlanMap(userMobile);
    switch (planMap.get(id)) {
      case (?p) {
        planMap.add(id, { p with billRefundStatus = status });
        true;
      };
      case null false;
    };
  };

  public query ({ caller = _ }) func getPlan(userMobile : Text, id : Nat) : async ?PlanWithId {
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

  public query ({ caller = _ }) func getAllPlans(userMobile : Text) : async [PlanWithId] {
    switch (userPlans.get(userMobile)) {
      case (?planMap) {
        planMap.entries().map(func((id, p) : (Nat, Plan)) : PlanWithId {
          planToWithId(id, p)
        }).toArray();
      };
      case null [];
    };
  };

  public query ({ caller = _ }) func getAllPlansForAdmin() : async [UserPlanData] {
    userPlans.entries().map(func((mobile, planMap) : (Text, Map.Map<Nat, Plan>)) : UserPlanData {
      let plans = planMap.entries().map(func((id, p) : (Nat, Plan)) : PlanWithId {
        planToWithId(id, p)
      }).toArray();
      { userMobile = mobile; plans };
    }).toArray();
  };

  // ─── Plan Options ─────────────────────────────────────────────────────────

  public query ({ caller = _ }) func getPlanOptions() : async [Text] {
    planOptions.toArray();
  };

  public shared ({ caller = _ }) func updatePlanOptions(newOptions : [Text]) : async () {
    planOptions.clear();
    for (opt in newOptions.values()) {
      planOptions.add(opt);
    };
  };

};
