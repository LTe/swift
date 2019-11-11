declare module 'swift-mock/lib/swiftParser' {
    export default class SwiftParser {
        constructor(fieldPatterns: string | JSON)
        parse(swiftMessage: string): JSON
    }
}