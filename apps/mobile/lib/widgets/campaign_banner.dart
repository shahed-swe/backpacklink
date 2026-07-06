import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../data/models.dart';

/// Large event-driven campaign banner card (admin-managed).
class CampaignBanner extends StatelessWidget {
  final Promotion promo;
  const CampaignBanner({super.key, required this.promo});

  static Color? _parse(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final h = hex.replaceAll('#', '');
    final v = int.tryParse(h.length == 6 ? 'FF$h' : h, radix: 16);
    return v == null ? null : Color(v);
  }

  bool get _launchable {
    final uri = promo.ctaUrl == null ? null : Uri.tryParse(promo.ctaUrl!);
    return uri != null && uri.hasScheme;
  }

  @override
  Widget build(BuildContext context) {
    final bg = _parse(promo.bgColor);
    final fg = _parse(promo.textColor) ?? Colors.white;
    final hasImage = promo.imageUrl != null && promo.imageUrl!.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: bg == null && !hasImage ? BpGradients.lagoon : null,
          color: bg,
          borderRadius: BorderRadius.circular(20),
          image: hasImage
              ? DecorationImage(
                  image: NetworkImage(promo.imageUrl!),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(
                      Colors.black.withValues(alpha: 0.35), BlendMode.darken),
                )
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (promo.couponCode != null && promo.couponCode!.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text('Use code ${promo.couponCode}',
                    style: TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: 12)),
              ),
              const SizedBox(height: 8),
            ],
            Text(promo.title,
                style: TextStyle(color: fg, fontSize: 22, fontWeight: FontWeight.w800, height: 1.1)),
            if (promo.subtitle != null && promo.subtitle!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(promo.subtitle!, style: TextStyle(color: fg.withValues(alpha: 0.9))),
            ],
            if (promo.ctaLabel != null && promo.ctaLabel!.isNotEmpty && _launchable) ...[
              const SizedBox(height: 14),
              FilledButton(
                onPressed: () =>
                    launchUrl(Uri.parse(promo.ctaUrl!), mode: LaunchMode.externalApplication),
                child: Text(promo.ctaLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
