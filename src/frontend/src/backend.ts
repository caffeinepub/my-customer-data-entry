/* eslint-disable */

// @ts-nocheck

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    _blob?: Uint8Array<ArrayBuffer> | null;
    directURL: string;
    onProgress?: (percentage: number) => void = undefined;
    private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null){
        if (blob) { this._blob = blob; }
        this.directURL = directURL;
    }
    static fromURL(url: string): ExternalBlob {
        return new ExternalBlob(url, null);
    }
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
        const url = URL.createObjectURL(new Blob([new Uint8Array(blob)], { type: 'application/octet-stream' }));
        return new ExternalBlob(url, blob);
    }
    public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
        if (this._blob) { return this._blob; }
        const response = await fetch(this.directURL);
        const blob = await response.blob();
        this._blob = new Uint8Array(await blob.arrayBuffer());
        return this._blob;
    }
    public getDirectURL(): string { return this.directURL; }
    public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
        this.onProgress = onProgress;
        return this;
    }
}
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
export interface TagOption {
    tagLabel: string;
    tagColor: string;
}
export interface backendInterface {
    addCustomer(customer: Customer): Promise<bigint>;
    deleteCustomer(id: bigint): Promise<void>;
    getAllCustomers(): Promise<Array<CustomerWithId>>;
    getCustomer(id: bigint): Promise<Customer>;
    getSettings(): Promise<Array<string>>;
    getTagOptions(): Promise<Array<TagOption>>;
    updateCustomer(id: bigint, customer: Customer): Promise<void>;
    updateSettings(newSettings: Array<string>): Promise<void>;
    updateTagOptions(newOptions: Array<TagOption>): Promise<void>;
}
export class Backend implements backendInterface {
    constructor(private actor: ActorSubclass<_SERVICE>, private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, private processError?: (error: unknown) => never){}
    async addCustomer(arg0: Customer): Promise<bigint> {
        if (this.processError) {
            try { return await this.actor.addCustomer(arg0); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.addCustomer(arg0);
    }
    async deleteCustomer(arg0: bigint): Promise<void> {
        if (this.processError) {
            try { return await this.actor.deleteCustomer(arg0); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.deleteCustomer(arg0);
    }
    async getAllCustomers(): Promise<Array<CustomerWithId>> {
        if (this.processError) {
            try { return await this.actor.getAllCustomers(); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.getAllCustomers();
    }
    async getCustomer(arg0: bigint): Promise<Customer> {
        if (this.processError) {
            try { return await this.actor.getCustomer(arg0); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.getCustomer(arg0);
    }
    async getSettings(): Promise<Array<string>> {
        if (this.processError) {
            try { return await this.actor.getSettings(); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.getSettings();
    }
    async getTagOptions(): Promise<Array<TagOption>> {
        if (this.processError) {
            try { return await this.actor.getTagOptions(); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.getTagOptions();
    }
    async updateCustomer(arg0: bigint, arg1: Customer): Promise<void> {
        if (this.processError) {
            try { return await this.actor.updateCustomer(arg0, arg1); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.updateCustomer(arg0, arg1);
    }
    async updateSettings(arg0: Array<string>): Promise<void> {
        if (this.processError) {
            try { return await this.actor.updateSettings(arg0); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.updateSettings(arg0);
    }
    async updateTagOptions(arg0: Array<TagOption>): Promise<void> {
        if (this.processError) {
            try { return await this.actor.updateTagOptions(arg0); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return await this.actor.updateTagOptions(arg0);
    }
}
export interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
    processError?: (error: unknown) => never;
}
export function createActor(canisterId: string, _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, options: CreateActorOptions = {}): Backend {
    const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    const actor = Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId, ...options.actorOptions });
    return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
