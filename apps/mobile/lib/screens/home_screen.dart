import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'country_screen.dart';
import 'region_screen.dart';

const _popular = [
  'Japan', 'Thailand', 'United States', 'Turkey',
  'United Arab Emirates', 'Spain', 'Italy', 'Singapore',
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<({List<Country> countries, List<Continent> continents})> _future;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<Country> countries, List<Continent> continents})> _load() async {
    final catalog = context.read<AppState>().catalog;
    final results = await Future.wait([catalog.countries(), catalog.continents()]);
    return (countries: results[0] as List<Country>, continents: results[1] as List<Continent>);
  }

  void _openCountry(Country c) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => CountryScreen(country: c)));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: AsyncView<({List<Country> countries, List<Continent> continents})>(
          future: _future,
          onRetry: () => setState(() => _future = _load()),
          errorMessage: 'Could not load destinations.',
          builder: (data) => _content(data.countries, data.continents),
        ),
      ),
    );
  }

  Widget _content(List<Country> countries, List<Continent> continents) {
    final filtered = _query.isEmpty
        ? <Country>[]
        : countries.where((c) => c.name.toLowerCase().contains(_query.toLowerCase())).take(20).toList();
    final popular = _popular
        .map((n) => countries.where((c) => c.name == n).cast<Country?>().firstWhere((_) => true, orElse: () => null))
        .whereType<Country>()
        .toList();

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _Hero(count: countries.length)),
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
          _section(const SectionHeader('Popular', 'Top destinations')),
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
                itemCount: continents.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) => ActionChip(
                  label: Text('🧭 ${continents[i].name}'),
                  onPressed: () => Navigator.push(
                      context, MaterialPageRoute(builder: (_) => RegionScreen(continent: continents[i]))),
                ),
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

class _Hero extends StatelessWidget {
  final int count;
  const _Hero({required this.count});

  @override
  Widget build(BuildContext context) {
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
          Text('Travel eSIM data in $count+ countries — no roaming bills.',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
        ],
      ),
    );
  }
}
