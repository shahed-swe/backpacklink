import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'country_screen.dart';
import 'region_screen.dart';
import 'coverage_screen.dart';
import 'global_screen.dart';
import 'destinations_screen.dart';

const _popular = [
  'Japan', 'Thailand', 'United States', 'Turkey',
  'United Arab Emirates', 'Spain', 'Italy', 'Singapore',
];

typedef _HomeData = ({List<Country> countries, List<Continent> continents, HomePromotions promos});

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  _HomeData? _data;
  Object? _error;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      final data = await _load();
      if (mounted) setState(() { _data = data; _error = null; });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<_HomeData> _load() async {
    final state = context.read<AppState>();
    final results = await Future.wait([state.catalog.countries(), state.catalog.continents()]);
    // A promo fetch failure must never block the page — degrade to no promos.
    HomePromotions promos;
    try {
      promos = await state.promotions.home();
    } catch (_) {
      promos = const HomePromotions();
    }
    return (
      countries: results[0] as List<Country>,
      continents: results[1] as List<Continent>,
      promos: promos,
    );
  }

  void _openCountry(Country c) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => CountryScreen(country: c)));

  @override
  Widget build(BuildContext context) {
    final data = _data;
    return Scaffold(
      body: SafeArea(
        child: data == null
            ? (_error != null
                ? ErrorRetry('Could not load destinations.', _refresh)
                : const LoadingView())
            : RefreshIndicator(
                onRefresh: _refresh,
                child: _content(data.countries, data.continents, data.promos),
              ),
      ),
    );
  }

  Widget _content(List<Country> countries, List<Continent> continents, HomePromotions promos) {
    final filtered = _query.isEmpty
        ? <Country>[]
        : countries.where((c) => c.name.toLowerCase().contains(_query.toLowerCase())).take(20).toList();
    final popular = _popular
        .map((n) => countries.where((c) => c.name == n).cast<Country?>().firstWhere((_) => true, orElse: () => null))
        .whereType<Country>()
        .toList();

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        if (promos.bar != null)
          SliverToBoxAdapter(child: PromoBar(promo: promos.bar!)),
        SliverToBoxAdapter(child: _Hero(count: countries.length, banners: promos.banners)),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          sliver: SliverToBoxAdapter(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Where are you travelling? e.g. Japan',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
          sliver: SliverToBoxAdapter(
            child: Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: () =>
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const CoverageScreen())),
                icon: const Icon(Icons.public, size: 18),
                label: const Text('Will it work here? Check coverage'),
              ),
            ),
          ),
        ),
        if (filtered.isNotEmpty)
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList.builder(
              itemCount: filtered.length,
              itemBuilder: (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: CountryTile(country: filtered[i], onTap: () => _openCountry(filtered[i])),
              ),
            ),
          )
        else ...[
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
            sliver: SliverToBoxAdapter(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Expanded(child: SectionHeader('Popular', 'Top destinations')),
                  TextButton(
                    onPressed: () => Navigator.push(
                        context, MaterialPageRoute(builder: (_) => const DestinationsScreen())),
                    child: const Text('See all'),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 2.6),
              itemCount: popular.length,
              itemBuilder: (_, i) => CountryTile(country: popular[i], onTap: () => _openCountry(popular[i])),
            ),
          ),
          _section(const SectionHeader('Travel wider', 'Regional plans')),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 56,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: continents.length + 1,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  if (i == 0) {
                    return ActionChip(
                      backgroundColor: BpColors.coral,
                      label: const Text('🌐 Global', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                      onPressed: () =>
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const GlobalScreen())),
                    );
                  }
                  final c = continents[i - 1];
                  return ActionChip(
                    label: Text('🧭 ${c.name}'),
                    onPressed: () =>
                        Navigator.push(context, MaterialPageRoute(builder: (_) => RegionScreen(continent: c))),
                  );
                },
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ],
    );
  }

  SliverPadding _section(Widget child) =>
      SliverPadding(padding: const EdgeInsets.fromLTRB(16, 24, 16, 12), sliver: SliverToBoxAdapter(child: child));
}

/// Banner-aware hero: default headline when there's no campaign; the campaign
/// image + copy when one exists; a swipeable, auto-advancing carousel when
/// several. The search + sections below (in the sliver list) stay put.
class _Hero extends StatefulWidget {
  final int count;
  final List<Promotion> banners;
  const _Hero({required this.count, required this.banners});
  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  final _pc = PageController();
  Timer? _timer;
  int _i = 0;

  @override
  void initState() {
    super.initState();
    if (widget.banners.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 6), (_) {
        if (!mounted || !_pc.hasClients) return;
        _i = (_i + 1) % widget.banners.length;
        _pc.animateToPage(_i, duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pc.dispose();
    super.dispose();
  }

  static Color? _color(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final h = hex.replaceAll('#', '');
    final v = int.tryParse(h.length == 6 ? 'FF$h' : h, radix: 16);
    return v == null ? null : Color(v);
  }

  static bool _launchable(String? url) {
    final uri = url == null ? null : Uri.tryParse(url);
    return uri != null && uri.hasScheme;
  }

  @override
  Widget build(BuildContext context) {
    final banners = widget.banners;
    if (banners.isEmpty) return _defaultHero();
    return SizedBox(
      height: 244,
      child: Stack(children: [
        PageView.builder(
          key: const PageStorageKey('heroBanners'),
          controller: _pc,
          itemCount: banners.length,
          onPageChanged: (i) => setState(() => _i = i),
          itemBuilder: (_, i) => _bannerCard(banners[i]),
        ),
        if (banners.length > 1)
          Positioned(
            bottom: 12,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(banners.length, (idx) {
                final active = idx == _i;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  height: 6,
                  width: active ? 18 : 6,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: active ? 1 : 0.5),
                    borderRadius: BorderRadius.circular(3),
                  ),
                );
              }),
            ),
          ),
      ]),
    );
  }

  Widget _bannerCard(Promotion p) {
    final hasImage = p.imageUrl != null && p.imageUrl!.isNotEmpty;
    final bg = _color(p.bgColor);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 30),
      decoration: BoxDecoration(
        gradient: bg == null && !hasImage ? BpGradients.lagoon : null,
        color: bg,
        image: hasImage
            ? DecorationImage(
                image: NetworkImage(p.imageUrl!),
                fit: BoxFit.cover,
                colorFilter: ColorFilter.mode(Colors.black.withValues(alpha: 0.4), BlendMode.darken),
              )
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (p.couponCode != null && p.couponCode!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text('Use code ${p.couponCode}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
            ),
            const SizedBox(height: 10),
          ],
          Text(p.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800, height: 1.1)),
          if (p.subtitle != null && p.subtitle!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(p.subtitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
          ],
          if (p.ctaLabel != null && p.ctaLabel!.isNotEmpty && _launchable(p.ctaUrl)) ...[
            const SizedBox(height: 14),
            FilledButton(
              onPressed: () => launchUrl(Uri.parse(p.ctaUrl!), mode: LaunchMode.externalApplication),
              child: Text(p.ctaLabel!),
            ),
          ],
        ],
      ),
    );
  }

  Widget _defaultHero() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
      decoration: const BoxDecoration(gradient: BpGradients.lagoon),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Backpack',
              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text('Land. Scan.\nYou’re online.',
              style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800, height: 1.1)),
          const SizedBox(height: 8),
          Text('Travel eSIM data in ${widget.count}+ countries — no roaming bills.',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
        ],
      ),
    );
  }
}
