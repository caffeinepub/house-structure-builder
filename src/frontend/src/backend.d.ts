import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Room {
    size: [bigint, bigint];
    position: [bigint, bigint];
    roomType: RoomType;
}
export interface FloorPlan {
    id: bigint;
    name: string;
    rooms: Array<Room>;
}
export enum RoomType {
    bedroom = "bedroom",
    bathroom = "bathroom",
    garage = "garage",
    kitchen = "kitchen",
    livingRoom = "livingRoom"
}
export interface backendInterface {
    deletePlan(id: bigint): Promise<void>;
    getAllPlans(): Promise<Array<FloorPlan>>;
    getPlan(id: bigint): Promise<FloorPlan>;
    savePlan(name: string, rooms: Array<Room>): Promise<bigint>;
    updatePlan(id: bigint, name: string, rooms: Array<Room>): Promise<void>;
}
