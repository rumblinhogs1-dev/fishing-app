// CatchDaddy Design Tokens
// Auto-generated from design-tokens.css — keep in sync
// Usage: Color.tokenPrimary (SwiftUI) or UIColor.tokenPrimary (UIKit)

import SwiftUI

extension Color {
    // MARK: - Primary
    static let tokenPrimary       = Color(hex: "2D6A4F")  // buttons, links, active
    static let tokenPrimaryDark   = Color(hex: "1B4332")  // headings, nav bg
    static let tokenPrimaryHover  = Color(hex: "245C3E")  // button hover
    static let tokenPrimaryLight  = Color(hex: "E8F5E9")  // selected/hover bg

    // MARK: - Status
    static let tokenSuccess       = Color(hex: "2E7D32")  // confirmations
    static let tokenSuccessBg     = Color(hex: "E8F5E9")  // success background
    static let tokenError         = Color(hex: "D32F2F")  // destructive actions
    static let tokenErrorDark     = Color(hex: "C62828")  // error toasts
    static let tokenErrorBg       = Color(hex: "FDECEA")  // error background
    static let tokenWarning       = Color(hex: "FF9800")  // warning accent
    static let tokenWarningText   = Color(hex: "E65100")  // warning label text
    static let tokenWarningBg     = Color(hex: "FFF3E0")  // warning background
    static let tokenInfo          = Color(hex: "1565C0")  // info toasts
    static let tokenInfoBg        = Color(hex: "F0F6FF")  // info background

    // MARK: - Gold / Premium
    static let tokenGold          = Color(hex: "D4A017")  // achievements, premium
    static let tokenGoldDark      = Color(hex: "B8860B")  // gold hover/pressed

    // MARK: - Text
    static let tokenText          = Color(hex: "222222")  // body text
    static let tokenTextSecondary = Color(hex: "555555")  // secondary text
    static let tokenTextMuted     = Color(hex: "888888")  // placeholders, hints
    static let tokenTextDisabled  = Color(hex: "AAAAAA")  // disabled text

    // MARK: - Surfaces & Backgrounds
    static let tokenBgPage        = Color(hex: "F0F4F8")  // page background
    static let tokenBgSurface     = Color(hex: "FFFFFF")  // cards, panels
    static let tokenBgElevated    = Color(hex: "F5F5F5")  // nested cards
    static let tokenBgHover       = Color(hex: "F0F0F0")  // list item hover

    // MARK: - Borders
    static let tokenBorder        = Color(hex: "DDDDDD")  // default borders
    static let tokenBorderLight   = Color(hex: "E0E0E0")  // light borders
    static let tokenDivider       = Color(hex: "E0E0E0")  // section dividers

    // MARK: - White
    static let tokenWhite         = Color.white
}

// MARK: - Hex Initializer
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255.0
            g = Double((int >> 8) & 0xFF) / 255.0
            b = Double(int & 0xFF) / 255.0
        default:
            r = 1; g = 1; b = 1
        }
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - UIKit Compatibility
extension UIColor {
    static let tokenPrimary       = UIColor(Color.tokenPrimary)
    static let tokenPrimaryDark   = UIColor(Color.tokenPrimaryDark)
    static let tokenPrimaryHover  = UIColor(Color.tokenPrimaryHover)
    static let tokenPrimaryLight  = UIColor(Color.tokenPrimaryLight)
    static let tokenSuccess       = UIColor(Color.tokenSuccess)
    static let tokenSuccessBg     = UIColor(Color.tokenSuccessBg)
    static let tokenError         = UIColor(Color.tokenError)
    static let tokenErrorDark     = UIColor(Color.tokenErrorDark)
    static let tokenErrorBg       = UIColor(Color.tokenErrorBg)
    static let tokenWarning       = UIColor(Color.tokenWarning)
    static let tokenWarningText   = UIColor(Color.tokenWarningText)
    static let tokenWarningBg     = UIColor(Color.tokenWarningBg)
    static let tokenInfo          = UIColor(Color.tokenInfo)
    static let tokenInfoBg        = UIColor(Color.tokenInfoBg)
    static let tokenGold          = UIColor(Color.tokenGold)
    static let tokenGoldDark      = UIColor(Color.tokenGoldDark)
    static let tokenText          = UIColor(Color.tokenText)
    static let tokenTextSecondary = UIColor(Color.tokenTextSecondary)
    static let tokenTextMuted     = UIColor(Color.tokenTextMuted)
    static let tokenTextDisabled  = UIColor(Color.tokenTextDisabled)
    static let tokenBgPage        = UIColor(Color.tokenBgPage)
    static let tokenBgSurface     = UIColor(Color.tokenBgSurface)
    static let tokenBgElevated    = UIColor(Color.tokenBgElevated)
    static let tokenBgHover       = UIColor(Color.tokenBgHover)
    static let tokenBorder        = UIColor(Color.tokenBorder)
    static let tokenBorderLight   = UIColor(Color.tokenBorderLight)
    static let tokenDivider       = UIColor(Color.tokenDivider)
    static let tokenWhite         = UIColor.white
}
