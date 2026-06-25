import * as ESTree from 'estree';
import { IObfuscatingGuard } from '../../../interfaces/node-transformers/preparing-transformers/obfuscating-guards/IObfuscatingGuard';
import { ObfuscatingGuardResult } from '../../../enums/node/ObfuscatingGuardResult';
export declare class ProcessEnvObfuscationGuard implements IObfuscatingGuard {
    private static isProcessEnvMemberExpression;
    private static isPartOfProcessEnvChain;
    check(node: ESTree.Node): ObfuscatingGuardResult;
}
