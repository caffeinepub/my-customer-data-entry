export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Customer {
    tag: string;
    name: string;
    mobileNumber: string;
    ghRga: string;
    address: string;
}
export interface CustomerWithId {
    id: bigint;
    tag: string;
    name: string;
    mobileNumber: string;
    ghRga: string;
    address: string;
}
export interface backendInterface {
    addCustomer(customer: Customer): Promise<bigint>;
    deleteCustomer(id: bigint): Promise<void>;
    getAllCustomers(): Promise<Array<CustomerWithId>>;
    getCustomer(id: bigint): Promise<Customer>;
    getSettings(): Promise<Array<string>>;
    updateCustomer(id: bigint, customer: Customer): Promise<void>;
    updateSettings(newSettings: Array<string>): Promise<void>;
}
