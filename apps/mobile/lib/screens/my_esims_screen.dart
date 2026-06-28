import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'esim_detail_screen.dart';
import 'login_screen.dart';

class MyEsimsScreen extends StatefulWidget {
  const MyEsimsScreen({super.key});
  @override
  State<MyEsimsScreen> createState() => _MyEsimsScreenState();
}

class _MyEsimsScreenState extends State<MyEsimsScreen> {
  Future<List<EsimRow>>? _future;

  void _goLogin() =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (!state.isLoggedIn) {
      _future = null;
      return Scaffold(body: AuthPrompt(message: 'Sign in to view your eSIMs.', onSignIn: _goLogin));
    }
    _future ??= state.account.myEsims();

    return Scaffold(
      appBar: AppBar(title: const Text('My eSIMs')),
      body: RefreshIndicator(
        onRefresh: () async => setState(() => _future = state.account.myEsims()),
        child: AsyncView<List<EsimRow>>(
          future: _future,
          onRetry: () => setState(() => _future = state.account.myEsims()),
          builder: (esims) {
            if (esims.isEmpty) {
              return ListView(children: const [
                SizedBox(height: 120),
                Center(child: Text('🎒', style: TextStyle(fontSize: 40))),
                SizedBox(height: 12),
                Center(child: Text('No eSIMs yet — your purchases show up here.')),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: esims.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final e = esims[i];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    title: Text(e.lastBundle ?? 'eSIM', style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('ICCID ${e.iccid}\n${e.status}'),
                    isThreeLine: true,
                    trailing: const Icon(Icons.chevron_right, color: BpColors.brand),
                    onTap: () => Navigator.push(
                        context, MaterialPageRoute(builder: (_) => EsimDetailScreen(esimId: e.id))),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
