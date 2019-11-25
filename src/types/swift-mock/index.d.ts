declare module 'swift-mock/lib/swiftParser' {
  import {ParsedSwift} from "../../utils";
  export default class SwiftParser {
        constructor(fieldPatterns: string | JSON)
        parse(swiftMessage: string): ParsedSwift
    }
}