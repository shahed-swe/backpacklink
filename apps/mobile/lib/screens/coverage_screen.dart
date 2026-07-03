import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';

class CoverageScreen extends StatefulWidget {
  const CoverageScreen({super.key});
  @override
  State<CoverageScreen> createState() => _CoverageScreenState();
}

class _CoverageScreenState extends State<CoverageScreen> {
  List<Country> _countries = [];
  String _q = '';
  Country? _picked;
  List<CoverageNet>? _nets;
  bool _loadingNets = false;

  @override
  void initState() {
    super.initState();
    context.read<AppState>().catalog.countries().then((c) {
      if (mounted) setState(() => _countries = c);
    }).catchError((_) {});
  }

  Future<void> _check(Country c) async {
    setState(() {
      _picked = c;
      _q = '';
      _nets = null;
      _loadingNets = true;
    });
    try {
      final nets = await context.read<AppState>().catalog.countryCoverage(c.id);
      if (mounted) setState(() => _nets = nets);
    } catch (_) {
      if (mounted) setState(() => _nets = []);
    } finally {
      if (mounted) setState(() => _loadingNets = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final matches = _q.isEmpty
        ? <Country>[]
        : _countries.where((c) => c.name.toLowerCase().contains(_q.toLowerCase())).take(8).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Will it work here?')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            decoration: const InputDecoration(hintText: 'Search a country…', prefixIcon: Icon(Icons.search)),
            onChanged: (v) => setState(() => _q = v),
          ),
          ...matches.map((c) => CountryTile(country: c, onTap: () => _check(c))),
          if (_picked != null) ...[
            const SizedBox(height: 16),
            Text(_picked!.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            if (_loadingNets)
              const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()))
            else if (_nets == null || _nets!.isEmpty)
              Text('No coverage data yet for ${_picked!.name}.', style: TextStyle(color: BpColors.inkFade(0.6)))
            else ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: BpColors.brandBg, borderRadius: BorderRadius.circular(16)),
                child: Text('✅ Yes — works on ${_nets!.length} network${_nets!.length > 1 ? 's' : ''} in ${_picked!.name}.',
                    style: const TextStyle(color: BpColors.brand, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 12),
              ..._nets!.map((n) => Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(children: [
                        Expanded(child: Text(n.name)),
                        ...['2G', '3G', '4G', '5G'].map((g) => Container(
                              margin: const EdgeInsets.only(left: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: n.generations.contains(g) ? BpColors.brand : BpColors.sand100,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(g,
                                  style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: n.generations.contains(g) ? Colors.white : BpColors.inkFade(0.3))),
                            )),
                      ]),
                    ),
                  )),
            ],
          ],
        ],
      ),
    );
  }
}
