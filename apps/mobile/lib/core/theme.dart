import 'package:flutter/material.dart';

/// BackpackLink "modern travel / adventure" palette — deep teal + warm coral.
class BpColors {
  static const ink = Color(0xFF0A1F24);
  static const brand = Color(0xFF039389);
  static const brandLight = Color(0xFF22D3C2);
  static const coral = Color(0xFFFF5A36);
  static const coralBg = Color(0xFFFFE4DD);
  static const brandBg = Color(0xFFEFFDFB);
  static const sand = Color(0xFFFDFAF6);
  static const sand100 = Color(0xFFFAF3EA);
  static const card = Colors.white;

  static Color inkFade(double o) => ink.withValues(alpha: o);
}

class BpGradients {
  static const lagoon = LinearGradient(
    colors: [BpColors.brand, BpColors.brandLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

ThemeData buildTheme() {
  final base = ThemeData(brightness: Brightness.light, useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: BpColors.sand,
    colorScheme: ColorScheme.fromSeed(
      seedColor: BpColors.brand,
      primary: BpColors.brand,
      secondary: BpColors.coral,
    ),
    textTheme: base.textTheme.apply(bodyColor: BpColors.ink, displayColor: BpColors.ink),
    appBarTheme: const AppBarTheme(
      backgroundColor: BpColors.sand,
      foregroundColor: BpColors.ink,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: BpColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: BpColors.coral,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(40)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFC8FCF3)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFC8FCF3)),
      ),
    ),
  );
}
