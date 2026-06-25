import * as ESTree from 'estree';
export interface IRenamePropertiesReplacer {
    excludePropertyName(propertyName: string): void;
    replace(node: ESTree.Identifier | ESTree.Literal | ESTree.PrivateIdentifier): ESTree.Identifier | ESTree.Literal | ESTree.PrivateIdentifier;
}
