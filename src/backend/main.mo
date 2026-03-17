import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

actor {
  type RoomType = {
    #bedroom;
    #kitchen;
    #bathroom;
    #livingRoom;
    #garage;
  };

  type Room = {
    roomType : RoomType;
    position : (Int, Int);
    size : (Nat, Nat);
  };

  type FloorPlan = {
    id : Nat;
    name : Text;
    rooms : [Room];
  };

  module FloorPlan {
    public func compare(a : FloorPlan, b : FloorPlan) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  var nextId = 0;
  let plans = Map.empty<Nat, FloorPlan>();

  public shared ({ caller }) func savePlan(name : Text, rooms : [Room]) : async Nat {
    let id = nextId;
    let plan : FloorPlan = {
      id;
      name;
      rooms;
    };
    plans.add(id, plan);
    nextId += 1;
    id;
  };

  public shared ({ caller }) func updatePlan(id : Nat, name : Text, rooms : [Room]) : async () {
    if (not plans.containsKey(id)) { Runtime.trap("Plan does not exist") };
    let updatedPlan : FloorPlan = {
      id;
      name;
      rooms;
    };
    plans.add(id, updatedPlan);
  };

  public shared ({ caller }) func deletePlan(id : Nat) : async () {
    if (not plans.containsKey(id)) { Runtime.trap("Plan does not exist") };
    plans.remove(id);
  };

  public query ({ caller }) func getPlan(id : Nat) : async FloorPlan {
    switch (plans.get(id)) {
      case (null) { Runtime.trap("Plan does not exist") };
      case (?plan) { plan };
    };
  };

  public query ({ caller }) func getAllPlans() : async [FloorPlan] {
    plans.values().toArray().sort();
  };
};
