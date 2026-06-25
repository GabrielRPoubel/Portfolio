import { IEscapeSequenceEncoder } from '../interfaces/utils/IEscapeSequenceEncoder';
export declare class EscapeSequenceEncoder implements IEscapeSequenceEncoder {
    private static readonly ASCIICharactersRegExp;
    private static readonly forceEscapeCharactersRegExp;
    private static readonly replaceRegExp;
    private readonly stringsCache;
    encode(string: string, encodeAllSymbols: boolean): string;
}
