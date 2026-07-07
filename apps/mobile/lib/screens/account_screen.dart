import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'login_screen.dart';
import 'support_screen.dart';
import 'coverage_screen.dart';
import 'troubleshooting_screen.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});
  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  Future<List<OrderRow>>? _orders;
  Future<String>? _version;

  void _goLogin() =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (!state.isLoggedIn) {
      _orders = null;
      return Scaffold(
        appBar: AppBar(title: const Text('Account')),
        body: AuthPrompt(emoji: '👤', message: 'Sign in to see your profile and orders.', onSignIn: _goLogin),
      );
    }

    final user = state.user!;
    _orders ??= state.account.orders();
    _version ??= state.appVersion();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account'),
        actions: [TextButton(onPressed: state.logout, child: const Text('Sign out'))],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user.name ?? 'Traveler', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                InfoRow('Email', user.email),
                if (user.phone != null) InfoRow('Phone', user.phone!),
                if (user.country != null) InfoRow('Country', user.country!),
              ]),
            ),
          ),
          const SizedBox(height: 20),
          const SectionHeader('Help', 'Support & more'),
          const SizedBox(height: 12),
          _HelpTile(
            icon: Icons.chat_bubble_outline,
            label: 'Chat with support',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen())),
          ),
          _HelpTile(
            icon: Icons.public,
            label: 'Will it work here? (coverage)',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CoverageScreen())),
          ),
          _HelpTile(
            icon: Icons.help_outline,
            label: 'Troubleshooting',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TroubleshootingScreen())),
          ),
          const SizedBox(height: 20),
          const SectionHeader('History', 'Your orders'),
          const SizedBox(height: 12),
          AsyncView<List<OrderRow>>(
            future: _orders,
            onRetry: () => setState(() => _orders = state.account.orders()),
            builder: (orders) {
              if (orders.isEmpty) return const Text('No orders yet.');
              return Column(
                children: orders
                    .map((o) => Card(
                          child: ListTile(
                            title: Text(o.packageName),
                            subtitle: Text(o.status),
                            trailing: Text(money(o.retailPrice, o.currency),
                                style: const TextStyle(fontWeight: FontWeight.w700)),
                          ),
                        ))
                    .toList(),
              );
            },
          ),
          const SizedBox(height: 24),
          Center(
            child: FutureBuilder<String>(
              future: _version,
              builder: (_, snap) {
                final v = snap.data ?? '';
                return Text(v.isEmpty ? '' : 'Version $v',
                    style: TextStyle(fontSize: 12, color: BpColors.inkFade(0.4)));
              },
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _HelpTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _HelpTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: BpColors.brand),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right, color: BpColors.brand),
        onTap: onTap,
      ),
    );
  }
}
