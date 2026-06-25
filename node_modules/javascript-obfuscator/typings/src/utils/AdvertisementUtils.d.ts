export declare class AdvertisementUtils {
    private static readonly maxDisplayCount;
    private static readonly resetPeriodMs;
    private static readonly ciEnvVars;
    private static readonly projectName;
    private static configPath;
    static isCI(): boolean;
    static shouldShowAdvertisement(): boolean;
    private static isNodeEnvironment;
    private static getConfigPath;
    private static readConfig;
    private static writeConfig;
}
