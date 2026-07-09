import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../data/services.dart';
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

  // Legal/policy pages live on the website; open them in an in-app browser view.
  static const _webBase = 'https://www.backpacklink.com';
  void _openLegal(String path) =>
      launchUrl(Uri.parse('$_webBase$path'), mode: LaunchMode.inAppBrowserView);

  Future<void> _changePassword(AccountService account) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => _ChangePasswordDialog(account: account),
    );
    if (ok == true && mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Password updated.')));
    }
  }

  Future<void> _deleteAccount(AccountService account) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => _DeleteAccountDialog(account: account),
    );
    if (ok != true || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    await context.read<AppState>().logout();
    messenger.showSnackBar(const SnackBar(content: Text('Your account has been deleted.')));
  }

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
          const SectionHeader('Security', 'Password & account'),
          const SizedBox(height: 12),
          _HelpTile(
            icon: Icons.lock_reset,
            label: 'Change password',
            onTap: () => _changePassword(state.account),
          ),
          _HelpTile(
            icon: Icons.delete_forever_outlined,
            label: 'Delete account',
            color: BpColors.coral,
            onTap: () => _deleteAccount(state.account),
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
          const SizedBox(height: 20),
          const SectionHeader('Legal', 'Policies & terms'),
          const SizedBox(height: 12),
          _HelpTile(
            icon: Icons.description_outlined,
            label: 'Terms & Conditions',
            trailingIcon: Icons.open_in_new,
            onTap: () => _openLegal('/terms'),
          ),
          _HelpTile(
            icon: Icons.privacy_tip_outlined,
            label: 'Privacy Policy',
            trailingIcon: Icons.open_in_new,
            onTap: () => _openLegal('/privacy'),
          ),
          _HelpTile(
            icon: Icons.lock_outline,
            label: 'Password Policy',
            trailingIcon: Icons.open_in_new,
            onTap: () => _openLegal('/password-policy'),
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
  final IconData trailingIcon;

  /// Accent for destructive actions; defaults to the brand colour.
  final Color? color;

  const _HelpTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailingIcon = Icons.chevron_right,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final accent = color ?? BpColors.brand;
    return Card(
      child: ListTile(
        leading: Icon(icon, color: accent),
        title: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: color)),
        trailing: Icon(trailingIcon, color: accent),
        onTap: onTap,
      ),
    );
  }
}

class _ChangePasswordDialog extends StatefulWidget {
  final AccountService account;
  const _ChangePasswordDialog({required this.account});
  @override
  State<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<_ChangePasswordDialog> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_next.text.length < 6) {
      setState(() => _error = 'New password must be at least 6 characters.');
      return;
    }
    if (_next.text != _confirm.text) {
      setState(() => _error = 'New passwords do not match.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.account.changePassword(_current.text, _next.text);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = '$e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Change password'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _PasswordField(controller: _current, label: 'Current password'),
          const SizedBox(height: 12),
          _PasswordField(controller: _next, label: 'New password'),
          const SizedBox(height: 12),
          _PasswordField(controller: _confirm, label: 'Confirm new password'),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: BpColors.coral, fontSize: 13)),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _busy ? null : () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Saving…' : 'Update'),
        ),
      ],
    );
  }
}

class _DeleteAccountDialog extends StatefulWidget {
  final AccountService account;
  const _DeleteAccountDialog({required this.account});
  @override
  State<_DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<_DeleteAccountDialog> {
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text.isEmpty) {
      setState(() => _error = 'Enter your password to confirm.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.account.deleteAccount(_password.text);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = '$e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Delete account'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'This permanently deletes your BackpackLink account. Your profile, '
            'support conversations and community tips are removed, and any eSIMs '
            'in your account will no longer be accessible.\n\n'
            'Purchase records are kept only as long as accounting law requires, '
            'with your personal details stripped out.\n\n'
            'This cannot be undone.',
            style: TextStyle(fontSize: 13.5, height: 1.4),
          ),
          const SizedBox(height: 16),
          _PasswordField(controller: _password, label: 'Enter your password'),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: BpColors.coral, fontSize: 13)),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _busy ? null : () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: BpColors.coral),
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Deleting…' : 'Delete my account'),
        ),
      ],
    );
  }
}

class _PasswordField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  const _PasswordField({required this.controller, required this.label});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: true,
      autocorrect: false,
      enableSuggestions: false,
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
    );
  }
}
