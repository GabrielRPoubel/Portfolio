import { TInputOptions } from '../types/options/TInputOptions';
import { IProApiConfig, IProObfuscationResult, TProApiProgressCallback } from '../interfaces/pro-api/IProApiClient';
export declare class ProApiClient {
    private static readonly apiHost;
    private static readonly apiUrl;
    private static readonly uploadTokenUrl;
    private static readonly defaultTimeout;
    private static readonly blobUploadThreshold;
    private readonly config;
    constructor(config: IProApiConfig);
    static hasProFeatures(options: TInputOptions): boolean;
    obfuscate(sourceCode: string, options?: TInputOptions, onProgress?: TProApiProgressCallback): Promise<IProObfuscationResult>;
    private obfuscateDirect;
    private obfuscateWithBlobUpload;
    private uploadToBlob;
    private getUploadToken;
    private uploadWithClientToken;
    private handleStreamingResponse;
    private reassembleChunkedResponse;
}
