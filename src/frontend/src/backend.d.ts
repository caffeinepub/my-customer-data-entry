import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TagOption {
    id: string;
    optionLabel: string;
    color: string;
}
export interface Settings {
    ghRgaOptions: Array<DropdownOption>;
}
export interface CustomerWithId {
    id: string;
    fields: Array<[string, string]>;
}
export interface DropdownOption {
    id: string;
    optionLabel: string;
    color: string;
}
export interface PlanWithId {
    id: string;
    status: string;
    dateStr: string;
    name: string;
    plan: string;
    installment: string;
    daysCount: bigint;
    mobile: string;
}
export interface CustomerData {
    fields: Array<[string, string]>;
}
export interface FieldDef {
    id: string;
    order: bigint;
    fieldLabel: string;
    required: boolean;
    fieldType: string;
}
export interface PlanData {
    status: string;
    dateStr: string;
    name: string;
    plan: string;
    installment: string;
    mobile: string;
}
export interface UserInfo {
    userName: string;
    mobile: string;
}
export interface PlanOption {
    id: string;
    optionLabel: string;
    color: string;
}
export interface backendInterface {
    addCustomer(mobile: string, data: CustomerData): Promise<string>;
    addPlan(mobile: string, plan: PlanData): Promise<string>;
    createUser(mobile: string, userName: string): Promise<boolean>;
    deleteAllPlans(mobile: string): Promise<boolean>;
    deleteCustomer(mobile: string, id: string): Promise<boolean>;
    deletePlan(mobile: string, id: string): Promise<boolean>;
    deleteUser(mobile: string): Promise<boolean>;
    generateOtp(mobile: string): Promise<string>;
    getAllCustomers(mobile: string): Promise<Array<CustomerWithId>>;
    getAllCustomersForAdmin(): Promise<Array<[string, Array<CustomerWithId>]>>;
    getAllPlans(mobile: string): Promise<Array<PlanWithId>>;
    getAllPlansForAdmin(): Promise<Array<[string, Array<PlanWithId>]>>;
    getColorTheme(): Promise<string>;
    getCustomer(mobile: string, id: string): Promise<CustomerWithId | null>;
    getCustomerCount(mobile: string): Promise<bigint>;
    getFieldDefinitions(): Promise<Array<FieldDef>>;
    getPlan(mobile: string, id: string): Promise<PlanWithId | null>;
    getPlanOptions(): Promise<Array<PlanOption>>;
    getRegisteredUsers(): Promise<Array<UserInfo>>;
    getSettings(): Promise<Settings>;
    getTagOptions(): Promise<Array<TagOption>>;
    getUserName(mobile: string): Promise<string | null>;
    updateColorTheme(theme: string): Promise<boolean>;
    updateCustomer(mobile: string, id: string, data: CustomerData): Promise<boolean>;
    updateFieldDefinitions(fields: Array<FieldDef>): Promise<boolean>;
    updatePlan(mobile: string, id: string, plan: PlanData): Promise<boolean>;
    updatePlanOptions(options: Array<PlanOption>): Promise<boolean>;
    updatePlanStatus(mobile: string, id: string, status: string): Promise<boolean>;
    updateSettings(s: Settings): Promise<boolean>;
    updateTagOptions(options: Array<TagOption>): Promise<boolean>;
    verifyOtp(mobile: string, otp: string): Promise<boolean>;
}
