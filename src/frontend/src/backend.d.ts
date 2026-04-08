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
    tagColor: string;
    tagLabel: string;
}
export interface Plan {
    name: string;
    plan: string;
    dateEntry: string;
    mobileNumber: string;
    installment: string;
    billRefundStatus: string;
}
export interface FieldDefinition {
    id: string;
    order: bigint;
    fieldLabel: string;
    fieldType: string;
}
export interface CustomerWithId {
    id: bigint;
    tag: string;
    name: string;
    mobileNumber: string;
    isHighlighted: boolean;
    customFields: Array<CustomField>;
    ghRga: string;
    address: string;
}
export interface PlanWithId {
    id: bigint;
    name: string;
    plan: string;
    dateEntry: string;
    mobileNumber: string;
    installment: string;
    daysCount: bigint;
    billRefundStatus: string;
}
export interface User {
    userName: string;
    createdAt: bigint;
    mobile: string;
}
export interface CustomField {
    fieldName: string;
    fieldValue: string;
}
export interface Customer {
    tag: string;
    name: string;
    mobileNumber: string;
    isHighlighted: boolean;
    customFields: Array<CustomField>;
    ghRga: string;
    address: string;
}
export interface UserPlanData {
    userMobile: string;
    plans: Array<PlanWithId>;
}
export interface UserCustomerData {
    userMobile: string;
    customers: Array<CustomerWithId>;
}
export interface backendInterface {
    addCustomer(userMobile: string, customer: Customer): Promise<bigint>;
    addPlan(userMobile: string, planData: Plan): Promise<PlanWithId>;
    createUser(adminMobile: string, newMobile: string, userName: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    deleteCustomer(userMobile: string, id: bigint): Promise<boolean>;
    deletePlan(userMobile: string, id: bigint): Promise<boolean>;
    deleteUser(adminMobile: string, mobile: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    generateOtp(mobile: string): Promise<string>;
    getAllCustomers(userMobile: string): Promise<Array<CustomerWithId>>;
    getAllCustomersForAdmin(): Promise<Array<UserCustomerData>>;
    getAllPlans(userMobile: string): Promise<Array<PlanWithId>>;
    getAllPlansForAdmin(): Promise<Array<UserPlanData>>;
    getAllUsers(): Promise<Array<string>>;
    getColorTheme(): Promise<string>;
    getCustomer(userMobile: string, id: bigint): Promise<CustomerWithId | null>;
    getCustomerCount(userMobile: string): Promise<bigint>;
    getFieldDefinitions(): Promise<Array<FieldDefinition>>;
    getPlan(userMobile: string, id: bigint): Promise<PlanWithId | null>;
    getPlanOptions(): Promise<Array<string>>;
    getRegisteredUsers(adminMobile: string): Promise<Array<User>>;
    getSettings(): Promise<Array<string>>;
    getTagOptions(): Promise<Array<TagOption>>;
    getUserName(mobile: string): Promise<string>;
    updateColorTheme(theme: string): Promise<void>;
    updateCustomer(userMobile: string, id: bigint, customer: Customer): Promise<boolean>;
    updateFieldDefinitions(fields: Array<FieldDefinition>): Promise<void>;
    updatePlan(userMobile: string, id: bigint, planData: Plan): Promise<boolean>;
    updatePlanOptions(newOptions: Array<string>): Promise<void>;
    updatePlanStatus(userMobile: string, id: bigint, status: string): Promise<boolean>;
    updateSettings(newSettings: Array<string>): Promise<void>;
    updateTagOptions(newOptions: Array<TagOption>): Promise<void>;
    verifyOtp(mobile: string, otp: string): Promise<boolean>;
}
