import Text "mo:core/Text";
import Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";

actor {
  type Customer = {
    name : Text;
    mobileNumber : Text;
    tag : Text;
    ghRga : Text;
    address : Text;
  };

  type CustomerWithId = {
    id : Nat;
    name : Text;
    mobileNumber : Text;
    tag : Text;
    ghRga : Text;
    address : Text;
  };

  type OldAppUser = { mobileNumber : Text; role : Text };
  type OldUserProfile = { name : Text };

  // Legacy stable variables retained for upgrade compatibility -- do not remove.
  let accessControlState = AccessControl.initState();
  let appUsers = Map.empty<Nat, OldAppUser>();
  stable var appUserIdCounter : Nat = 0;
  let userProfiles = Map.empty<Principal, OldUserProfile>();

  func compareCustomerWithId(c1 : CustomerWithId, c2 : CustomerWithId) : Order.Order {
    Text.compare(c1.name, c2.name);
  };

  let customers = Map.empty<Nat, Customer>();
  let settings = List.fromArray(["GH", "RGA", "CLOSE", "NOT INTERESTED"]);
  var customerIdCounter = 0;

  // Customer CRUD operations
  public shared ({ caller = _ }) func addCustomer(customer : Customer) : async Nat {
    let id = customerIdCounter;
    customers.add(id, customer);
    customerIdCounter += 1;
    id;
  };

  public shared ({ caller = _ }) func updateCustomer(id : Nat, customer : Customer) : async () {
    if (not customers.containsKey(id)) {
      Runtime.trap("Customer not found");
    };
    customers.add(id, customer);
  };

  public shared ({ caller = _ }) func deleteCustomer(id : Nat) : async () {
    if (not customers.containsKey(id)) {
      Runtime.trap("Customer not found");
    };
    customers.remove(id);
  };

  public query ({ caller = _ }) func getCustomer(id : Nat) : async Customer {
    switch (customers.get(id)) {
      case (?customer) { customer };
      case (null) { Runtime.trap("Customer not found") };
    };
  };

  public query ({ caller = _ }) func getAllCustomers() : async [CustomerWithId] {
    let withIds = customers.entries().map(func((id, c) : (Nat, Customer)) : CustomerWithId {
      { id; name = c.name; mobileNumber = c.mobileNumber; tag = c.tag; ghRga = c.ghRga; address = c.address }
    }).toArray();
    withIds.sort(compareCustomerWithId);
  };

  // Settings operations
  public shared ({ caller = _ }) func updateSettings(newSettings : [Text]) : async () {
    settings.clear();
    for (setting in newSettings.values()) {
      settings.add(setting);
    };
  };

  public query ({ caller = _ }) func getSettings() : async [Text] {
    settings.toArray();
  };
};
